from app.models.profile import ColumnProfile
from app.models.validation import DetectedIssue
from app.schemas.trust_score import TrustScoreDimension, TrustScoreResponse


def calculate_trust_score(
    dataset_id: str,
    profiles: list[ColumnProfile],
    issues: list[DetectedIssue],
    row_count: int,
) -> TrustScoreResponse:
    completeness = _calc_completeness(profiles)
    validity = _calc_validity(issues, row_count)
    consistency = _calc_consistency(issues, row_count)
    uniqueness = _calc_uniqueness(profiles)
    integrity = _calc_integrity(issues)

    dimensions = [
        TrustScoreDimension(name="Completeness", score=completeness, weight=0.25,
                            details="Measures percentage of non-null values"),
        TrustScoreDimension(name="Validity", score=validity, weight=0.20,
                            details="Measures percentage of values matching expected types"),
        TrustScoreDimension(name="Consistency", score=consistency, weight=0.20,
                            details="Measures pattern and format consistency"),
        TrustScoreDimension(name="Uniqueness", score=uniqueness, weight=0.20,
                            details="Measures duplicate-free ratio"),
        TrustScoreDimension(name="Integrity", score=integrity, weight=0.15,
                            details="Measures rule validation pass rate"),
    ]

    overall = sum(d.score * d.weight for d in dimensions)

    return TrustScoreResponse(
        dataset_id=dataset_id,
        overall_score=round(overall, 1),
        dimensions=dimensions,
    )


def _calc_completeness(profiles: list[ColumnProfile]) -> float:
    if not profiles:
        return 100.0
    avg_null_pct = sum(p.null_percentage for p in profiles) / len(profiles)
    return round(max(0, 100 - avg_null_pct), 1)


def _calc_validity(issues: list[DetectedIssue], row_count: int) -> float:
    if row_count == 0:
        return 100.0
    type_issues = [i for i in issues if i.issue_type in ("type_mismatch", "missing_value") and i.status == "open"]
    affected = sum(i.affected_count for i in type_issues)
    return round(max(0, 100 - (affected / row_count * 100)), 1)


def _calc_consistency(issues: list[DetectedIssue], row_count: int) -> float:
    if row_count == 0:
        return 100.0
    pattern_issues = [i for i in issues if i.issue_type in ("outlier", "duplicate_row") and i.status == "open"]
    affected = sum(i.affected_count for i in pattern_issues)
    return round(max(0, 100 - (affected / row_count * 100)), 1)


def _calc_uniqueness(profiles: list[ColumnProfile]) -> float:
    if not profiles:
        return 100.0
    total_dups = sum(p.duplicate_count for p in profiles)
    total_values = sum(
        (p.null_count + p.unique_count + p.duplicate_count) for p in profiles
    )
    if total_values == 0:
        return 100.0
    dup_pct = total_dups / total_values * 100
    return round(max(0, 100 - dup_pct), 1)


def _calc_integrity(issues: list[DetectedIssue]) -> float:
    rule_issues = [i for i in issues if i.issue_type.startswith("rule_violation") and i.status == "open"]
    if not rule_issues:
        return 100.0
    return round(max(0, 100 - len(rule_issues) * 10), 1)
