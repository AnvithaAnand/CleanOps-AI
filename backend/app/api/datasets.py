import json
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import async_session, get_db
from app.models.dataset import Dataset, DatasetVersion
from app.models.profile import ColumnProfile
from app.models.validation import DetectedIssue, ValidationRun
from app.schemas.audit import AuditLogResponse
from app.schemas.dataset import (
    DataPreviewResponse,
    DatasetListItem,
    DatasetResponse,
    DatasetVersionResponse,
    RepairRequest,
    RepairResultResponse,
)
from app.schemas.profile import ColumnProfileResponse, ProfileResponse
from app.schemas.trust_score import TrustScoreResponse
from app.schemas.validation import IssueResponse, IssuesListResponse, RepairSuggestionResponse, ValidateRequest, ValidationRunResponse
from app.services.audit_service import log_action
from app.services.detector import detect_issues
from app.services.ingestion import parse_file
from app.services.profiler import profile_dataset
from app.services.repairer import apply_repairs
from app.services.trust_score import calculate_trust_score
from app.services.validator import run_validation
from app.utils.file_utils import detect_file_type, save_upload_file
from app.models.audit import AuditLog

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


async def _process_dataset(dataset_id: str):
    async with async_session() as db:
        try:
            result = await db.execute(
                select(Dataset).where(Dataset.id == dataset_id)
            )
            dataset = result.scalar_one()
            dataset.status = "profiling"
            await db.commit()

            df = parse_file(dataset.file_path, dataset.file_type)
            dataset.row_count = len(df)
            dataset.column_count = len(df.columns)
            await db.commit()

            profiles = await profile_dataset(dataset_id, df, db)
            dataset.status = "profiled"
            await db.commit()

            issues = await detect_issues(dataset_id, df, db)
            await db.commit()

            result = await db.execute(
                select(ColumnProfile).where(ColumnProfile.dataset_id == dataset_id)
            )
            profiles = result.scalars().all()
            result = await db.execute(
                select(DetectedIssue).where(
                    DetectedIssue.dataset_id == dataset_id,
                    DetectedIssue.status == "open",
                )
            )
            open_issues = result.scalars().all()

            score_resp = calculate_trust_score(
                dataset_id, profiles, open_issues, dataset.row_count or 0
            )
            dataset.trust_score = score_resp.overall_score
            dataset.status = "validated"
            await db.commit()

            await log_action(
                db, dataset_id, "profile",
                f"Profiled {dataset.column_count} columns, detected {len(issues)} issues. Trust score: {score_resp.overall_score}",
            )
            await db.commit()

        except Exception as e:
            dataset.status = "error"
            await db.commit()
            raise


@router.post("/upload", response_model=DatasetResponse, status_code=201)
async def upload_dataset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    file_type = detect_file_type(file.filename)
    dataset_name = name or file.filename.rsplit(".", 1)[0]

    import uuid
    dataset_id = str(uuid.uuid4())

    file_path, file_size = await save_upload_file(file, dataset_id)

    dataset = Dataset(
        id=dataset_id,
        name=dataset_name,
        original_filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size_bytes=file_size,
        status="uploaded",
    )
    db.add(dataset)
    await db.flush()

    await log_action(
        db, dataset_id, "upload",
        f"Uploaded file '{file.filename}' ({file_size} bytes)",
    )

    background_tasks.add_task(_process_dataset, dataset_id)

    return DatasetResponse.model_validate(dataset)


@router.get("/", response_model=list[DatasetListItem])
async def list_datasets(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Dataset).order_by(Dataset.created_at.desc())
    if status:
        query = query.where(Dataset.status == status)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    datasets = result.scalars().all()
    return [DatasetListItem.model_validate(d) for d in datasets]


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    return DatasetResponse.model_validate(dataset)


@router.get("/{dataset_id}/profile", response_model=ProfileResponse)
async def get_profile(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ColumnProfile)
        .where(ColumnProfile.dataset_id == dataset_id)
        .order_by(ColumnProfile.column_index)
    )
    profiles = result.scalars().all()

    columns = []
    for p in profiles:
        resp = ColumnProfileResponse.model_validate(p)
        if isinstance(resp.top_values, str):
            try:
                resp.top_values = json.loads(resp.top_values)
            except Exception:
                pass
        if isinstance(resp.distribution, str):
            try:
                resp.distribution = json.loads(resp.distribution)
            except Exception:
                pass
        if isinstance(resp.sample_values, str):
            try:
                resp.sample_values = json.loads(resp.sample_values)
            except Exception:
                pass
        columns.append(resp)

    return ProfileResponse(dataset_id=dataset_id, columns=columns)


@router.get("/{dataset_id}/issues", response_model=IssuesListResponse)
async def get_issues(
    dataset_id: str,
    severity: Optional[str] = Query(None),
    issue_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(DetectedIssue)
        .where(DetectedIssue.dataset_id == dataset_id)
        .options(selectinload(DetectedIssue.repair_suggestions))
    )
    if severity:
        query = query.where(DetectedIssue.severity == severity)
    if issue_type:
        query = query.where(DetectedIssue.issue_type == issue_type)
    if status:
        query = query.where(DetectedIssue.status == status)

    query = query.order_by(DetectedIssue.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    issues = result.scalars().unique().all()

    count_query = (
        select(DetectedIssue)
        .where(DetectedIssue.dataset_id == dataset_id)
    )
    if severity:
        count_query = count_query.where(DetectedIssue.severity == severity)
    if issue_type:
        count_query = count_query.where(DetectedIssue.issue_type == issue_type)
    if status:
        count_query = count_query.where(DetectedIssue.status == status)
    count_result = await db.execute(count_query)
    total = len(count_result.scalars().all())

    issue_responses = []
    for issue in issues:
        resp = IssueResponse(
            id=issue.id,
            issue_type=issue.issue_type,
            severity=issue.severity,
            column_name=issue.column_name,
            affected_count=issue.affected_count,
            description=issue.description,
            current_value_sample=issue.current_value_sample,
            expected_value=issue.expected_value,
            status=issue.status,
            created_at=issue.created_at,
            repair_suggestions=[
                RepairSuggestionResponse.model_validate(s)
                for s in issue.repair_suggestions
            ],
        )
        issue_responses.append(resp)

    return IssuesListResponse(
        dataset_id=dataset_id,
        total=total,
        issues=issue_responses,
    )


@router.post("/{dataset_id}/repair", response_model=RepairResultResponse)
async def apply_dataset_repairs(
    dataset_id: str,
    body: RepairRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Dataset not found")

    repair_result = await apply_repairs(dataset_id, body.suggestion_ids, db)

    result = await db.execute(
        select(ColumnProfile).where(ColumnProfile.dataset_id == dataset_id)
    )
    profiles = result.scalars().all()
    result = await db.execute(
        select(DetectedIssue).where(
            DetectedIssue.dataset_id == dataset_id,
            DetectedIssue.status == "open",
        )
    )
    open_issues = result.scalars().all()
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id)
    )
    dataset = result.scalar_one()

    score = calculate_trust_score(
        dataset_id, profiles, open_issues, dataset.row_count or 0
    )
    dataset.trust_score = score.overall_score

    return RepairResultResponse(
        version_number=repair_result["version_number"],
        repairs_applied=repair_result["repairs_applied"],
        rows_affected=repair_result["rows_affected"],
        new_trust_score=score.overall_score,
    )


@router.get("/{dataset_id}/versions", response_model=list[DatasetVersionResponse])
async def get_versions(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DatasetVersion)
        .where(DatasetVersion.dataset_id == dataset_id)
        .order_by(DatasetVersion.version_number.desc())
    )
    versions = result.scalars().all()
    return [DatasetVersionResponse.model_validate(v) for v in versions]


@router.get("/{dataset_id}/audit", response_model=list[AuditLogResponse])
async def get_audit_log(
    dataset_id: str,
    skip: int = Query(0),
    limit: int = Query(100),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.dataset_id == dataset_id)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    logs = result.scalars().all()
    responses = []
    for log in logs:
        resp = AuditLogResponse.model_validate(log)
        for field in ("before_snapshot", "after_snapshot", "metadata_json"):
            val = getattr(resp, field)
            if isinstance(val, str):
                try:
                    setattr(resp, field, json.loads(val))
                except Exception:
                    pass
        responses.append(resp)
    return responses


@router.get("/{dataset_id}/trust-score", response_model=TrustScoreResponse)
async def get_trust_score(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    result = await db.execute(
        select(ColumnProfile).where(ColumnProfile.dataset_id == dataset_id)
    )
    profiles = result.scalars().all()
    result = await db.execute(
        select(DetectedIssue).where(
            DetectedIssue.dataset_id == dataset_id,
            DetectedIssue.status == "open",
        )
    )
    open_issues = result.scalars().all()

    return calculate_trust_score(
        dataset_id, profiles, open_issues, dataset.row_count or 0
    )


@router.post("/{dataset_id}/validate", response_model=ValidationRunResponse)
async def validate_dataset(
    dataset_id: str,
    body: Optional[ValidateRequest] = None,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    df = parse_file(dataset.file_path, dataset.file_type)
    rule_ids = body.rule_ids if body else None
    run = await run_validation(dataset_id, df, db, rule_ids)

    return ValidationRunResponse.model_validate(run)


@router.get("/{dataset_id}/download")
async def download_dataset(
    dataset_id: str,
    version: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    if version:
        result = await db.execute(
            select(DatasetVersion).where(
                DatasetVersion.dataset_id == dataset_id,
                DatasetVersion.version_number == version,
            )
        )
        ver = result.scalar_one_or_none()
        if not ver:
            raise HTTPException(404, "Version not found")
        file_path = ver.file_path
    else:
        file_path = dataset.file_path

    return FileResponse(
        file_path,
        filename=f"{dataset.name}_cleaned.csv",
        media_type="text/csv",
    )


@router.get("/{dataset_id}/preview", response_model=DataPreviewResponse)
async def preview_data(
    dataset_id: str,
    rows: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    df = parse_file(dataset.file_path, dataset.file_type)
    preview = df.head(rows)

    preview = preview.where(preview.notna(), None)

    return DataPreviewResponse(
        columns=list(df.columns),
        rows=preview.to_dict(orient="records"),
        total_rows=len(df),
    )
