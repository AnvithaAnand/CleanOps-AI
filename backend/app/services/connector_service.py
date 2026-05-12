import io
import re
import httpx
import pandas as pd


def _google_sheets_to_csv_url(url: str) -> str:
    """Convert a Google Sheets share URL to its CSV export URL."""
    # Handle /edit, /pub, or bare /d/ID URLs
    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9_-]+)", url)
    if not match:
        raise ValueError("Could not extract Google Sheets ID from URL")
    sheet_id = match.group(1)

    # Extract gid (tab) if present
    gid_match = re.search(r"[#&?]gid=(\d+)", url)
    gid = gid_match.group(1) if gid_match else "0"

    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"


async def import_from_url(url: str) -> pd.DataFrame:
    """Download a CSV/Excel/Parquet file from a public URL."""
    async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
        response = await client.get(url)
        response.raise_for_status()

    content = response.content
    content_type = response.headers.get("content-type", "")
    lower_url = url.lower().split("?")[0]

    if lower_url.endswith(".parquet") or lower_url.endswith(".pq"):
        return pd.read_parquet(io.BytesIO(content))
    elif lower_url.endswith(".xlsx") or lower_url.endswith(".xls") or "spreadsheetml" in content_type:
        return pd.read_excel(io.BytesIO(content))
    else:
        # Default to CSV
        return pd.read_csv(io.BytesIO(content))


async def import_from_google_sheets(url: str) -> pd.DataFrame:
    """Import data from a public Google Sheets URL."""
    csv_url = _google_sheets_to_csv_url(url)
    return await import_from_url(csv_url)


async def import_from_postgresql(host: str, port: int, database: str,
                                  username: str, password: str, query: str) -> pd.DataFrame:
    """Run a query against a PostgreSQL database and return a DataFrame."""
    try:
        import asyncpg
    except ImportError:
        raise RuntimeError("asyncpg is required for PostgreSQL imports")

    conn_str = f"postgresql://{username}:{password}@{host}:{port}/{database}"
    conn = await asyncpg.connect(conn_str)
    try:
        rows = await conn.fetch(query)
        if not rows:
            return pd.DataFrame()
        return pd.DataFrame([dict(r) for r in rows])
    finally:
        await conn.close()
