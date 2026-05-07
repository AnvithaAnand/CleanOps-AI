import numpy as np
import pandas as pd


def safe_float(val) -> float | None:
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def compute_iqr_bounds(series: pd.Series) -> tuple[float, float]:
    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    return float(lower), float(upper)


def compute_histogram(series: pd.Series, bins: int = 20) -> list[dict]:
    numeric = pd.to_numeric(series, errors="coerce").dropna()
    if len(numeric) == 0:
        return []
    counts, edges = np.histogram(numeric, bins=min(bins, len(numeric.unique())))
    return [
        {"bin_start": float(edges[i]), "bin_end": float(edges[i + 1]), "count": int(counts[i])}
        for i in range(len(counts))
    ]


def compute_value_counts(series: pd.Series, top_n: int = 10) -> list[dict]:
    counts = series.value_counts().head(top_n)
    return [{"value": str(v), "count": int(c)} for v, c in counts.items()]
