import json
import re
from typing import Optional

from app.config import settings


def _get_client():
    if not settings.GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        return genai.GenerativeModel("gemini-1.5-flash")
    except Exception:
        return None


def _call(prompt: str) -> Optional[str]:
    model = _get_client()
    if not model:
        return None
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception:
        return None


def _parse_json(text: str) -> Optional[dict]:
    if not text:
        return None
    try:
        cleaned = re.sub(r"```(?:json)?", "", text).strip().strip("`").strip()
        return json.loads(cleaned)
    except Exception:
        return None


def explain_issue(
    issue_type: str,
    column_name: Optional[str],
    affected_count: int,
    total_rows: int,
    description: str,
    column_type: Optional[str] = None,
    dataset_name: str = "dataset",
) -> dict:
    fallback = {
        "explanation": description,
        "why_it_matters": "Data quality issues can affect downstream analysis and reporting.",
        "risk_level": "medium",
        "recommendation": "Review and apply the suggested repair.",
        "downstream_impact": "Reports or models using this column may produce incorrect results.",
        "ai_powered": False,
    }

    pct = round(affected_count / total_rows * 100, 1) if total_rows else 0

    prompt = f"""You are a senior data engineer reviewing a data quality issue. Provide a concise, insightful analysis.

Dataset: {dataset_name}
Issue Type: {issue_type}
Column: {column_name or "entire dataset"}
Column Type: {column_type or "unknown"}
Affected Rows: {affected_count} out of {total_rows} ({pct}%)
Description: {description}

Respond ONLY with valid JSON in this exact format:
{{
  "explanation": "1-2 sentence plain English explanation of what is wrong",
  "why_it_matters": "1 sentence on the business/analytical impact",
  "risk_level": "low|medium|high|critical",
  "recommendation": "1 sentence specific action to fix this",
  "downstream_impact": "1 sentence on what downstream assets could be affected"
}}"""

    result = _call(prompt)
    parsed = _parse_json(result)
    if parsed and "explanation" in parsed:
        parsed["ai_powered"] = True
        return parsed
    return fallback


def explain_dataset(
    dataset_name: str,
    row_count: int,
    column_count: int,
    trust_score: float,
    dimensions: list[dict],
    issues: list[dict],
    pii_columns: list[str],
) -> dict:
    fallback = {
        "summary": f"{dataset_name} has a trust score of {trust_score}/100 with {len(issues)} detected issues.",
        "key_concerns": [i.get("description", "") for i in issues[:3]],
        "overall_risk": "medium" if trust_score < 80 else "low",
        "recommended_actions": ["Review and apply suggested repairs.", "Validate data against business rules."],
        "readiness": "needs_cleaning" if trust_score < 80 else "ready",
        "ai_powered": False,
    }

    dim_str = "\n".join(f"  - {d['name']}: {d['score']}/100" for d in dimensions)
    issue_str = "\n".join(f"  - [{i.get('severity','?')}] {i.get('description','')[:80]}" for i in issues[:8])
    pii_str = ", ".join(pii_columns) if pii_columns else "none detected"

    prompt = f"""You are a senior data quality analyst. Provide an executive-level assessment of this dataset.

Dataset: {dataset_name}
Rows: {row_count} | Columns: {column_count}
Overall Trust Score: {trust_score}/100

Quality Dimensions:
{dim_str}

Issues Found ({len(issues)} total):
{issue_str}

PII Columns: {pii_str}

Respond ONLY with valid JSON in this exact format:
{{
  "summary": "2-3 sentence executive summary of the dataset's quality state",
  "key_concerns": ["concern 1", "concern 2", "concern 3"],
  "overall_risk": "low|medium|high|critical",
  "recommended_actions": ["action 1", "action 2", "action 3"],
  "readiness": "ready|needs_cleaning|not_ready",
  "narrative": "3-4 sentence detailed narrative about this dataset's quality, what's good, what needs attention, and what the risk is if used as-is"
}}"""

    result = _call(prompt)
    parsed = _parse_json(result)
    if parsed and "summary" in parsed:
        parsed["ai_powered"] = True
        return parsed
    return fallback


def parse_nl_command(
    command: str,
    columns: list[str],
    column_types: dict[str, str],
) -> dict:
    fallback = {
        "understood": False,
        "message": "Could not interpret command. Try: 'fill missing [column] with median' or 'remove duplicate rows'.",
        "ai_powered": False,
    }

    cols_str = "\n".join(f"  - {c} ({t})" for c, t in column_types.items())

    prompt = f"""You are a data cleaning assistant. Parse the user's natural language cleaning command into a structured action.

User Command: "{command}"

Available Columns:
{cols_str}

Valid strategies: mean_imputation, median_imputation, mode_imputation, drop_rows, deduplicate, clip_outlier, remove_outlier_rows, coerce_type

Respond ONLY with valid JSON:
{{
  "understood": true,
  "action": "strategy_name",
  "column": "column_name or null for whole-dataset actions",
  "message": "1 sentence confirming what will be done",
  "confidence": 0.0-1.0
}}

If command is unclear or column doesn't exist, respond:
{{
  "understood": false,
  "message": "explanation of what was unclear"
}}"""

    result = _call(prompt)
    parsed = _parse_json(result)
    if parsed and "understood" in parsed:
        parsed["ai_powered"] = True
        return parsed
    return fallback


def generate_cleaning_code(
    dataset_name: str,
    repairs: list[dict],
    column_types: dict[str, str],
) -> dict:
    fallback = {
        "pandas_code": _generate_fallback_code(dataset_name, repairs),
        "explanation": "Generated pandas cleaning code based on applied repairs.",
        "ai_powered": False,
    }

    repairs_str = "\n".join(
        f"  - {r.get('strategy')} on column '{r.get('column')}'" for r in repairs[:15]
    )
    types_str = "\n".join(f"  {c}: {t}" for c, t in list(column_types.items())[:10])

    prompt = f"""You are a Python data engineer. Generate clean, production-quality pandas code to reproduce these data cleaning steps.

Dataset: {dataset_name} (loaded as df)

Column Types:
{types_str}

Repairs Applied:
{repairs_str}

Requirements:
- Use pandas best practices
- Add brief inline comments
- Handle edge cases (e.g. all-null columns)
- Output should be a complete, runnable script

Respond ONLY with valid JSON:
{{
  "pandas_code": "complete Python code as a single string with \\n for newlines",
  "explanation": "2 sentence summary of what the code does"
}}"""

    result = _call(prompt)
    parsed = _parse_json(result)
    if parsed and "pandas_code" in parsed:
        parsed["ai_powered"] = True
        return parsed
    return fallback


def _generate_fallback_code(dataset_name: str, repairs: list[dict]) -> str:
    lines = [
        "import pandas as pd",
        "import numpy as np",
        "",
        f"df = pd.read_csv('{dataset_name}.csv')",
        "",
        "# Applied repairs",
    ]
    for r in repairs:
        strategy = r.get("strategy", "")
        col = r.get("column")
        if strategy == "mean_imputation" and col:
            lines.append(f"df['{col}'].fillna(df['{col}'].mean(), inplace=True)")
        elif strategy == "median_imputation" and col:
            lines.append(f"df['{col}'].fillna(df['{col}'].median(), inplace=True)")
        elif strategy == "mode_imputation" and col:
            lines.append(f"df['{col}'].fillna(df['{col}'].mode()[0], inplace=True)")
        elif strategy == "drop_rows" and col:
            lines.append(f"df.dropna(subset=['{col}'], inplace=True)")
        elif strategy == "deduplicate":
            lines.append("df.drop_duplicates(inplace=True)")
        elif strategy == "clip_outlier" and col:
            lines.append(f"q1, q3 = df['{col}'].quantile([0.25, 0.75])")
            lines.append(f"iqr = q3 - q1")
            lines.append(f"df['{col}'] = df['{col}'].clip(q1 - 1.5*iqr, q3 + 1.5*iqr)")
        elif strategy == "coerce_type" and col:
            lines.append(f"df['{col}'] = pd.to_numeric(df['{col}'], errors='coerce')")

    lines += ["", "df.to_csv(f'{dataset_name}_cleaned.csv', index=False)", "print('Cleaned dataset saved.')"]
    return "\n".join(lines)
