import io
import json
import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
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
from app.services.alert_service import create_alert, evaluate_alert_rules
from app.services.contract_service import validate_contract
from app.services.audit_service import log_action
from app.services.connector_service import import_from_google_sheets, import_from_postgresql, import_from_url
from app.services.detector import detect_issues
from app.services.drift_service import detect_drift, get_drift_reports, has_baseline, save_baseline
from app.services.ingestion import parse_file
from app.services.lineage_service import add_lineage_edge, add_lineage_node, get_lineage_graph
from app.services.profiler import profile_dataset
from app.services.repairer import apply_repairs
from app.services.trust_score import calculate_trust_score
from app.services.validator import run_validation
from app.utils.file_utils import detect_file_type, save_upload_file
from app.models.audit import AuditLog
from app.services.job_service import create_job, update_job
from app.services.webhook_service import fire_webhooks
from app.models.trust_history import TrustScoreSnapshot

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


async def _record_snapshot(db: AsyncSession, dataset_id: str, score: float, event_type: str) -> None:
    db.add(TrustScoreSnapshot(dataset_id=dataset_id, score=round(score, 2), event_type=event_type))


async def _run_repairs_background(dataset_id: str, suggestion_ids: list[str], job_id: str | None = None):
    async with async_session() as db:
        try:
            if job_id:
                await update_job(db, job_id, "running", progress=10)
                await db.commit()

            repair_result = await apply_repairs(dataset_id, suggestion_ids, db)
            await db.commit()

            if job_id:
                await update_job(db, job_id, "running", progress=40)
                await db.commit()

            result = await db.execute(
                select(Dataset).where(Dataset.id == dataset_id)
            )
            dataset = result.scalar_one()

            df = parse_file(dataset.file_path, dataset.file_type)
            dataset.row_count = len(df)
            dataset.column_count = len(df.columns)

            profiles = await profile_dataset(dataset_id, df, db)
            if job_id:
                await update_job(db, job_id, "running", progress=70)
                await db.commit()

            issues = await detect_issues(dataset_id, df, db)
            await db.flush()

            score = calculate_trust_score(
                dataset_id, profiles, issues, dataset.row_count or 0
            )
            dataset.trust_score = score.overall_score
            dataset.status = "validated"
            await _record_snapshot(db, dataset_id, score.overall_score, "repaired")
            await db.commit()

            # Lineage: repair node linked to most recent issues node
            repair_node = await add_lineage_node(
                db, dataset_id, "repair",
                f"{repair_result.get('repairs_applied', len(suggestion_ids))} repairs applied",
                entity_id=job_id,
                metadata={"repairs_applied": repair_result.get("repairs_applied", 0), "trust_score": score.overall_score},
            )
            await db.commit()

            await log_action(db, dataset_id, "repair_complete",
                f"Repairs applied and re-profiled. Trust score: {score.overall_score}")
            if job_id:
                await update_job(db, job_id, "completed", progress=100,
                    result={"trust_score": score.overall_score, "repairs_applied": repair_result["repairs_applied"]})
            await db.commit()
        except Exception as e:
            await db.rollback()
            if job_id:
                async with async_session() as err_db:
                    await update_job(err_db, job_id, "failed", error=str(e))
                    await err_db.commit()
            print(f"Background repair failed: {e}")


async def _process_dataset(dataset_id: str, job_id: str | None = None):
    async with async_session() as db:
        try:
            if job_id:
                await update_job(db, job_id, "running", progress=5)
                await db.commit()

            result = await db.execute(
                select(Dataset).where(Dataset.id == dataset_id)
            )
            dataset = result.scalar_one()
            dataset.status = "profiling"
            await db.commit()

            # Lineage: upload node
            upload_node = await add_lineage_node(db, dataset_id, "upload", f"Uploaded: {dataset.name}")
            await db.commit()

            df = parse_file(dataset.file_path, dataset.file_type)
            dataset.row_count = len(df)
            dataset.column_count = len(df.columns)
            if job_id:
                await update_job(db, job_id, "running", progress=20)
            await db.commit()

            profiles = await profile_dataset(dataset_id, df, db)
            dataset.status = "profiled"
            if job_id:
                await update_job(db, job_id, "running", progress=50)
            await db.commit()

            issues = await detect_issues(dataset_id, df, db)
            await db.flush()
            if job_id:
                await update_job(db, job_id, "running", progress=80)
                await db.commit()

            # Drift: save baseline on first run, detect drift on subsequent runs
            already_has_baseline = await has_baseline(db, dataset_id)
            drift_count = 0
            if already_has_baseline:
                drift_reports = await detect_drift(db, dataset_id, profiles, dataset.row_count or 0)
                drift_count = len(drift_reports)
            else:
                await save_baseline(db, dataset_id, profiles)
            await db.commit()

            score_resp = calculate_trust_score(
                dataset_id, profiles, issues, dataset.row_count or 0
            )
            dataset.trust_score = score_resp.overall_score
            dataset.status = "validated"
            await _record_snapshot(db, dataset_id, score_resp.overall_score, "profiled")
            await db.commit()

            # Lineage: profile + issues nodes
            profile_node = await add_lineage_node(
                db, dataset_id, "profile", f"Profiled {dataset.column_count} columns",
                entity_id=job_id,
                metadata={"trust_score": score_resp.overall_score, "drift_count": drift_count},
            )
            await add_lineage_edge(db, upload_node.id, profile_node.id, "processed_by")
            issues_node = await add_lineage_node(
                db, dataset_id, "issues", f"{len(issues)} issues detected",
                metadata={"issue_count": len(issues)},
            )
            await add_lineage_edge(db, profile_node.id, issues_node.id, "detected")
            await db.commit()

            # Alerts + Contract validation
            drift_list = drift_reports if already_has_baseline else []
            await evaluate_alert_rules(db, dataset_id, score_resp.overall_score,
                                        len(issues), profiles, drift_list)
            await validate_contract(db, dataset_id, score_resp.overall_score,
                                     profiles, dataset.row_count or 0)
            await db.commit()

            await log_action(
                db, dataset_id, "profile",
                f"Profiled {dataset.column_count} columns, detected {len(issues)} issues. Trust score: {score_resp.overall_score}",
            )
            if job_id:
                await update_job(db, job_id, "completed", progress=100,
                    result={"trust_score": score_resp.overall_score, "issues_found": len(issues)})
            await db.commit()

            await fire_webhooks(db, "scan.completed", {
                "dataset_id": dataset_id,
                "dataset_name": dataset.name,
                "trust_score": score_resp.overall_score,
                "issues_found": len(issues),
                "drift_detected": drift_count > 0,
            })

        except Exception as e:
            dataset.status = "error"
            await db.commit()
            if job_id:
                async with async_session() as err_db:
                    await update_job(err_db, job_id, "failed", error=str(e))
                    await err_db.commit()
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

    job = await create_job(db, dataset_id, "profile")
    await db.flush()

    background_tasks.add_task(_process_dataset, dataset_id, job.id)

    return DatasetResponse.model_validate(dataset)


class ImportUrlRequest(BaseModel):
    url: str
    name: Optional[str] = None


class ImportGoogleSheetsRequest(BaseModel):
    url: str
    name: Optional[str] = None


class ImportPostgresRequest(BaseModel):
    host: str
    port: int = 5432
    database: str
    username: str
    password: str
    query: str
    name: Optional[str] = None


async def _save_df_as_dataset(df, dataset_name: str, source_label: str, db: AsyncSession,
                               background_tasks: BackgroundTasks) -> DatasetResponse:
    """Persist a DataFrame as a new Dataset and kick off profiling."""
    import os
    from app.config import settings
    from app.utils.file_utils import ensure_upload_dir

    dataset_id = str(uuid.uuid4())
    upload_dir = ensure_upload_dir(dataset_id)
    file_path = os.path.join(upload_dir, "data.csv")
    df.to_csv(file_path, index=False)
    file_size = os.path.getsize(file_path)

    dataset = Dataset(
        id=dataset_id,
        name=dataset_name,
        original_filename=source_label,
        file_path=file_path,
        file_type="csv",
        file_size_bytes=file_size,
        status="uploaded",
    )
    db.add(dataset)
    await db.flush()

    await log_action(db, dataset_id, "import", f"Imported from {source_label} ({file_size} bytes)")

    job = await create_job(db, dataset_id, "import")
    await db.flush()
    await db.commit()

    background_tasks.add_task(_process_dataset, dataset_id, job.id)
    return DatasetResponse.model_validate(dataset)


@router.post("/import/url", response_model=DatasetResponse, status_code=201)
async def import_from_url_endpoint(
    body: ImportUrlRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    try:
        df = await import_from_url(body.url)
    except Exception as e:
        raise HTTPException(400, f"Failed to fetch URL: {e}")

    name = body.name or body.url.rstrip("/").split("/")[-1].split("?")[0].rsplit(".", 1)[0] or "imported_dataset"
    return await _save_df_as_dataset(df, name, body.url, db, background_tasks)


@router.post("/import/google-sheets", response_model=DatasetResponse, status_code=201)
async def import_from_google_sheets_endpoint(
    body: ImportGoogleSheetsRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    try:
        df = await import_from_google_sheets(body.url)
    except Exception as e:
        raise HTTPException(400, f"Failed to import Google Sheet: {e}")

    name = body.name or "Google Sheet Import"
    return await _save_df_as_dataset(df, name, body.url, db, background_tasks)


@router.post("/import/postgresql", response_model=DatasetResponse, status_code=201)
async def import_from_postgresql_endpoint(
    body: ImportPostgresRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    try:
        df = await import_from_postgresql(
            body.host, body.port, body.database,
            body.username, body.password, body.query,
        )
    except Exception as e:
        raise HTTPException(400, f"PostgreSQL import failed: {e}")

    name = body.name or f"{body.database}_import"
    return await _save_df_as_dataset(df, name, f"postgresql://{body.host}/{body.database}", db, background_tasks)


@router.get("/", response_model=list[DatasetListItem])
async def list_datasets(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Dataset).order_by(Dataset.created_at.desc())
    if status:
        query = query.where(Dataset.status == status)
    if search:
        query = query.where(Dataset.name.ilike(f"%{search}%"))
    if tag:
        query = query.where(Dataset.tags.ilike(f'%"{tag}"%'))
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


class CatalogUpdate(BaseModel):
    description: Optional[str] = None
    tags: Optional[list[str]] = None


@router.patch("/{dataset_id}/catalog")
async def update_catalog(dataset_id: str, body: CatalogUpdate, db: AsyncSession = Depends(get_db)):
    import json as _json
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    if body.description is not None:
        dataset.description = body.description
    if body.tags is not None:
        dataset.tags = _json.dumps(body.tags)
    await db.commit()
    return {
        "id": dataset.id,
        "description": dataset.description,
        "tags": _json.loads(dataset.tags or "[]"),
    }


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


@router.post("/{dataset_id}/repair")
async def apply_dataset_repairs(
    dataset_id: str,
    body: RepairRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Dataset not found")

    job = await create_job(db, dataset_id, "repair")
    await db.flush()

    background_tasks.add_task(
        _run_repairs_background, dataset_id, body.suggestion_ids, job.id
    )

    return {"status": "processing", "repairs_queued": len(body.suggestion_ids), "job_id": job.id}


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


@router.get("/{dataset_id}/trust-history")
async def get_trust_history(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TrustScoreSnapshot)
        .where(TrustScoreSnapshot.dataset_id == dataset_id)
        .order_by(TrustScoreSnapshot.recorded_at.asc())
    )
    snapshots = result.scalars().all()
    return [
        {"score": s.score, "event_type": s.event_type, "recorded_at": s.recorded_at.isoformat()}
        for s in snapshots
    ]


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


@router.get("/{dataset_id}/report")
async def export_report(
    dataset_id: str,
    format: str = Query("excel", pattern="^(excel|pdf)$"),
    db: AsyncSession = Depends(get_db),
):
    from app.services.report_service import generate_excel_report, generate_pdf_report
    from fastapi.responses import Response

    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    safe_name = dataset.name.replace(" ", "_")[:40]
    if format == "pdf":
        data = await generate_pdf_report(db, dataset_id)
        return Response(
            content=data,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}_report.pdf"'},
        )
    else:
        data = await generate_excel_report(db, dataset_id)
        return Response(
            content=data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}_report.xlsx"'},
        )


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


@router.get("/{dataset_id}/lineage")
async def get_dataset_lineage(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Dataset not found")
    return await get_lineage_graph(db, dataset_id)


@router.get("/{dataset_id}/drift")
async def get_dataset_drift(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Dataset not found")
    reports = await get_drift_reports(db, dataset_id)
    return [
        {
            "id": r.id,
            "drift_type": r.drift_type,
            "severity": r.severity,
            "column_name": r.column_name,
            "description": r.description,
            "baseline_value": r.baseline_value,
            "current_value": r.current_value,
            "drift_score": r.drift_score,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]


@router.delete("/{dataset_id}", status_code=204)
async def delete_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    import os
    if dataset.file_path and os.path.exists(dataset.file_path):
        try:
            os.remove(dataset.file_path)
        except OSError:
            pass
    await db.delete(dataset)
    await db.commit()


@router.post("/{dataset_id}/baseline/reset")
async def reset_baseline(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    result = await db.execute(
        select(ColumnProfile).where(ColumnProfile.dataset_id == dataset_id)
    )
    profiles = result.scalars().all()
    if not profiles:
        raise HTTPException(400, "No profiles found — upload and process the dataset first")

    await save_baseline(db, dataset_id, profiles)
    await db.commit()
    return {"status": "baseline_reset", "columns": len(profiles)}
