import json

import pandas as pd
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import ColumnProfile
from app.utils.pii_detector import detect_pii
from app.utils.stats_utils import compute_histogram, compute_value_counts, safe_float


def detect_column_type(series: pd.Series) -> str:
    non_null = series.dropna()
    if len(non_null) == 0:
        return "string"

    if pd.api.types.is_bool_dtype(series):
        return "boolean"

    if pd.api.types.is_integer_dtype(series):
        return "integer"

    if pd.api.types.is_float_dtype(series):
        return "float"

    sample = non_null.astype(str).head(100)

    int_parseable = sample.apply(_is_int).mean()
    if int_parseable > 0.8:
        return "integer"

    float_parseable = sample.apply(_is_float).mean()
    if float_parseable > 0.8:
        return "float"

    date_parseable = sample.apply(_is_date).mean()
    if date_parseable > 0.8:
        return "datetime"

    bool_vals = {"true", "false", "yes", "no", "1", "0", "t", "f", "y", "n"}
    if set(sample.str.lower().unique()).issubset(bool_vals):
        return "boolean"

    n_unique = non_null.nunique()
    if n_unique <= min(20, len(non_null) * 0.05) and n_unique > 1:
        return "categorical"

    return "string"


def _is_int(val: str) -> bool:
    try:
        int(val.replace(",", "").strip())
        return True
    except (ValueError, AttributeError):
        return False


def _is_float(val: str) -> bool:
    try:
        float(val.replace(",", "").strip())
        return True
    except (ValueError, AttributeError):
        return False


def _is_date(val: str) -> bool:
    try:
        pd.to_datetime(val)
        return True
    except Exception:
        return False


def _detect_pattern(series: pd.Series) -> str | None:
    non_null = series.dropna().astype(str).head(100)
    if len(non_null) == 0:
        return None

    def to_pattern(s: str) -> str:
        result = []
        for c in s:
            if c.isdigit():
                result.append("D")
            elif c.isalpha():
                result.append("A")
            else:
                result.append(c)
        return "".join(result)

    patterns = non_null.apply(to_pattern)
    most_common = patterns.mode()
    if len(most_common) > 0:
        return most_common.iloc[0]
    return None


async def profile_dataset(dataset_id: str, df: pd.DataFrame, db: AsyncSession) -> list[ColumnProfile]:
    await db.execute(
        delete(ColumnProfile).where(ColumnProfile.dataset_id == dataset_id)
    )

    profiles = []
    for idx, col in enumerate(df.columns):
        series = df[col]
        total = len(series)
        col_type = detect_column_type(series)

        null_count = int(series.isna().sum())
        null_pct = round(null_count / total * 100, 2) if total > 0 else 0.0
        unique_count = int(series.nunique())
        unique_pct = round(unique_count / total * 100, 2) if total > 0 else 0.0
        dup_count = int(total - unique_count - null_count)

        min_val = max_val = None
        mean_val = median_val = std_val = None
        distribution = None
        top_values = None

        if col_type in ("integer", "float"):
            numeric = pd.to_numeric(series, errors="coerce").dropna()
            if len(numeric) > 0:
                min_val = str(numeric.min())
                max_val = str(numeric.max())
                mean_val = safe_float(numeric.mean())
                median_val = safe_float(numeric.median())
                std_val = safe_float(numeric.std())
                distribution = json.dumps(compute_histogram(numeric))
        elif col_type == "datetime":
            dates = pd.to_datetime(series, errors="coerce").dropna()
            if len(dates) > 0:
                min_val = str(dates.min())
                max_val = str(dates.max())
        else:
            top_values = json.dumps(compute_value_counts(series.dropna()))

        if top_values is None:
            top_values = json.dumps(compute_value_counts(series.dropna()))

        pii_type = detect_pii(series, col)

        sample = series.dropna().head(5).astype(str).tolist()

        profile = ColumnProfile(
            dataset_id=dataset_id,
            column_name=col,
            column_index=idx,
            detected_type=col_type,
            null_count=null_count,
            null_percentage=null_pct,
            unique_count=unique_count,
            unique_percentage=unique_pct,
            duplicate_count=max(dup_count, 0),
            min_value=min_val,
            max_value=max_val,
            mean_value=mean_val,
            median_value=median_val,
            std_dev=std_val,
            top_values=top_values,
            distribution=distribution,
            pattern=_detect_pattern(series),
            is_pii=pii_type is not None,
            pii_type=pii_type,
            sample_values=json.dumps(sample),
        )
        db.add(profile)
        profiles.append(profile)

    await db.flush()
    return profiles
