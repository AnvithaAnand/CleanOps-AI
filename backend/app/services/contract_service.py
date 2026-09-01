import json
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.contract import DataContract
from app.models.dataset import Dataset
from app.models.profile import ColumnProfile
from app.services.alert_service import create_alert


async def get_contract(db: AsyncSession, dataset_id: str) -> DataContract | None:
    result = await db.execute(
        select(DataContract).where(DataContract.dataset_id == dataset_id)
    )
    return result.scalar_one_or_none()


async def upsert_contract(db: AsyncSession, dataset_id: str, **kwargs) -> DataContract:
    contract = await get_contract(db, dataset_id)
    if contract:
        for k, v in kwargs.items():
            setattr(contract, k, v)
    else:
        contract = DataContract(dataset_id=dataset_id, **kwargs)
        db.add(contract)
    await db.flush()
    return contract


async def validate_contract(db: AsyncSession, dataset_id: str,
                              trust_score: float,
                              profiles: list[ColumnProfile],
                              row_count: int) -> list[dict]:
    contract = await get_contract(db, dataset_id)
    if not contract:
        return []

    violations: list[dict] = []

    # Min trust score
    if contract.min_trust_score is not None and trust_score < contract.min_trust_score:
        violations.append({
            "rule": "min_trust_score",
            "message": f"Trust score {trust_score:.1f}% is below contract minimum {contract.min_trust_score:.1f}%",
            "severity": "critical" if trust_score < contract.min_trust_score - 10 else "warning",
        })

    # Max null percentage
    if contract.max_null_percentage is not None:
        offenders = [
            p.column_name for p in profiles
            if (p.null_percentage or 0) > contract.max_null_percentage
        ]
        if offenders:
            violations.append({
                "rule": "max_null_percentage",
                "message": f"Columns exceed max null {contract.max_null_percentage:.0f}%: {', '.join(offenders[:5])}",
                "severity": "warning",
            })

    # Min row count
    if contract.min_row_count is not None and row_count < contract.min_row_count:
        violations.append({
            "rule": "min_row_count",
            "message": f"Row count {row_count:,} is below contract minimum {contract.min_row_count:,}",
            "severity": "warning",
        })

    # Freshness SLA
    if contract.freshness_sla_hours is not None:
        dataset_result = await db.execute(
            select(Dataset).where(Dataset.id == dataset_id)
        )
        dataset = dataset_result.scalar_one_or_none()
        if dataset and dataset.updated_at:
            age_hours = (datetime.now(timezone.utc) - dataset.updated_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600
            if age_hours > contract.freshness_sla_hours:
                violations.append({
                    "rule": "freshness_sla",
                    "message": f"Dataset is {age_hours:.1f}h old, exceeds SLA of {contract.freshness_sla_hours}h",
                    "severity": "critical" if age_hours > contract.freshness_sla_hours * 2 else "warning",
                })

    # Schema definition
    if contract.schema_definition:
        try:
            required_cols = json.loads(contract.schema_definition)
            current_col_names = {p.column_name for p in profiles}
            current_col_types = {p.column_name: p.detected_type for p in profiles}

            for col_def in required_cols:
                col_name = col_def.get("name")
                if not col_name:
                    continue
                if col_def.get("required") and col_name not in current_col_names:
                    violations.append({
                        "rule": "schema",
                        "message": f"Required column '{col_name}' is missing from dataset",
                        "severity": "critical",
                    })
                elif col_def.get("type") and col_name in current_col_types:
                    expected = col_def["type"].lower()
                    actual = (current_col_types[col_name] or "").lower()
                    if expected != actual and not (expected in ("float", "int") and actual in ("float", "int", "numeric")):
                        violations.append({
                            "rule": "schema",
                            "message": f"Column '{col_name}' expected type '{col_def['type']}' but found '{current_col_types[col_name]}'",
                            "severity": "warning",
                        })
        except (json.JSONDecodeError, TypeError):
            pass

    # Fire alerts for violations
    for v in violations:
        await create_alert(
            db, dataset_id, "contract_violation",
            v["severity"],
            f"Contract Violation: {v['rule'].replace('_', ' ').title()}",
            v["message"],
        )

    await db.flush()
    return violations
