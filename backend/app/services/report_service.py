import io
from datetime import datetime

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dataset import Dataset
from app.models.profile import ColumnProfile
from app.models.validation import DetectedIssue


async def _fetch_report_data(db: AsyncSession, dataset_id: str):
    ds_result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = ds_result.scalar_one_or_none()

    prof_result = await db.execute(select(ColumnProfile).where(ColumnProfile.dataset_id == dataset_id))
    profiles = prof_result.scalars().all()

    issue_result = await db.execute(select(DetectedIssue).where(DetectedIssue.dataset_id == dataset_id))
    issues = issue_result.scalars().all()

    return dataset, profiles, issues


async def generate_excel_report(db: AsyncSession, dataset_id: str) -> bytes:
    dataset, profiles, issues = await _fetch_report_data(db, dataset_id)

    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        # Sheet 1 — Summary
        summary_data = {
            "Field": ["Dataset Name", "File", "Rows", "Columns", "Trust Score", "Status", "Report Generated"],
            "Value": [
                dataset.name,
                dataset.original_filename,
                dataset.row_count or "—",
                dataset.column_count or "—",
                f"{dataset.trust_score:.1f}/100" if dataset.trust_score is not None else "—",
                dataset.status,
                datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            ],
        }
        pd.DataFrame(summary_data).to_excel(writer, sheet_name="Summary", index=False)

        # Sheet 2 — Column Profiles
        if profiles:
            profile_rows = []
            for p in profiles:
                profile_rows.append({
                    "Column": p.column_name,
                    "Type": p.inferred_type,
                    "Null %": f"{p.null_percentage:.1f}%" if p.null_percentage is not None else "—",
                    "Unique %": f"{p.unique_percentage:.1f}%" if p.unique_percentage is not None else "—",
                    "Mean": f"{p.mean:.2f}" if p.mean is not None else "—",
                    "Std Dev": f"{p.std_dev:.2f}" if p.std_dev is not None else "—",
                    "Min": p.min_value or "—",
                    "Max": p.max_value or "—",
                })
            pd.DataFrame(profile_rows).to_excel(writer, sheet_name="Column Profiles", index=False)

        # Sheet 3 — Issues
        if issues:
            issue_rows = [
                {
                    "Column": i.column_name or "—",
                    "Issue Type": i.issue_type,
                    "Severity": i.severity,
                    "Description": i.description,
                    "Affected Rows": i.affected_rows or "—",
                }
                for i in issues
            ]
            pd.DataFrame(issue_rows).to_excel(writer, sheet_name="Issues", index=False)

    return buf.getvalue()


async def generate_pdf_report(db: AsyncSession, dataset_id: str) -> bytes:
    from fpdf import FPDF

    dataset, profiles, issues = await _fetch_report_data(db, dataset_id)

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_margins(15, 15, 15)

    # Header
    pdf.set_fill_color(99, 102, 241)
    pdf.rect(0, 0, 210, 28, "F")
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(255, 255, 255)
    pdf.set_y(8)
    pdf.cell(0, 10, "CleanOps AI — Data Quality Report", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, datetime.utcnow().strftime("Generated %Y-%m-%d %H:%M UTC"), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_y(34)
    pdf.set_text_color(0, 0, 0)

    def section(title):
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_fill_color(240, 240, 255)
        pdf.cell(0, 8, title, fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 9)
        pdf.ln(1)

    def row(label, value):
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(55, 6, label + ":", new_x="RIGHT", new_y="TOP")
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(0, 6, str(value), new_x="LMARGIN", new_y="NEXT")

    # Summary
    section("Dataset Summary")
    row("Name", dataset.name)
    row("Original File", dataset.original_filename)
    row("Rows", f"{dataset.row_count:,}" if dataset.row_count else "—")
    row("Columns", dataset.column_count or "—")
    row("Status", dataset.status.upper())
    score = dataset.trust_score
    row("Trust Score", f"{score:.1f} / 100" if score is not None else "—")
    pdf.ln(4)

    # Trust score bar
    if score is not None:
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(0, 5, "Trust Score", new_x="LMARGIN", new_y="NEXT")
        bar_w = 160
        pdf.set_fill_color(230, 230, 230)
        pdf.rect(15, pdf.get_y(), bar_w, 6, "F")
        fill_color = (16, 185, 129) if score >= 80 else (245, 158, 11) if score >= 60 else (239, 68, 68)
        pdf.set_fill_color(*fill_color)
        pdf.rect(15, pdf.get_y(), bar_w * score / 100, 6, "F")
        pdf.ln(10)

    # Issues summary
    section(f"Issues ({len(issues)} detected)")
    if issues:
        critical = [i for i in issues if i.severity == "critical"]
        warnings = [i for i in issues if i.severity == "warning"]
        info = [i for i in issues if i.severity == "info"]
        row("Critical", len(critical))
        row("Warning", len(warnings))
        row("Info", len(info))
        pdf.ln(3)
        for issue in issues[:20]:
            col = issue.column_name or "—"
            pdf.set_font("Helvetica", "B", 8)
            pdf.cell(40, 5, col[:20], new_x="RIGHT", new_y="TOP")
            pdf.set_font("Helvetica", "", 8)
            pdf.cell(30, 5, issue.issue_type, new_x="RIGHT", new_y="TOP")
            pdf.cell(20, 5, issue.severity, new_x="RIGHT", new_y="TOP")
            pdf.cell(0, 5, (issue.description or "")[:60], new_x="LMARGIN", new_y="NEXT")
        if len(issues) > 20:
            pdf.set_font("Helvetica", "I", 8)
            pdf.cell(0, 5, f"... and {len(issues) - 20} more issues. Download Excel report for full list.")
            pdf.ln(5)
    else:
        pdf.set_font("Helvetica", "I", 9)
        pdf.cell(0, 6, "No issues detected.", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Column profiles
    if profiles:
        pdf.add_page()
        section(f"Column Profiles ({len(profiles)} columns)")
        pdf.set_font("Helvetica", "B", 8)
        for label, w in [("Column", 40), ("Type", 25), ("Null %", 20), ("Unique %", 20), ("Mean", 25), ("Min/Max", 50)]:
            pdf.cell(w, 6, label, new_x="RIGHT", new_y="TOP")
        pdf.ln(6)
        pdf.set_font("Helvetica", "", 8)
        for p in profiles:
            null_pct = f"{p.null_percentage:.1f}%" if p.null_percentage is not None else "—"
            unique_pct = f"{p.unique_percentage:.1f}%" if p.unique_percentage is not None else "—"
            mean = f"{p.mean:.2f}" if p.mean is not None else "—"
            minmax = f"{p.min_value or '—'} / {p.max_value or '—'}"
            for val, w in [(p.column_name[:18], 40), (p.inferred_type or "—", 25), (null_pct, 20), (unique_pct, 20), (mean, 25), (minmax[:24], 50)]:
                pdf.cell(w, 5, str(val), new_x="RIGHT", new_y="TOP")
            pdf.ln(5)

    return bytes(pdf.output())
