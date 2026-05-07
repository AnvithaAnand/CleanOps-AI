import os
import shutil
from pathlib import Path

from fastapi import UploadFile

from app.config import settings


def ensure_upload_dir(dataset_id: str) -> str:
    path = os.path.join(settings.UPLOAD_DIR, dataset_id)
    os.makedirs(path, exist_ok=True)
    return path


async def save_upload_file(upload_file: UploadFile, dataset_id: str) -> tuple[str, int]:
    upload_dir = ensure_upload_dir(dataset_id)
    file_path = os.path.join(upload_dir, upload_file.filename)

    size = 0
    with open(file_path, "wb") as f:
        while chunk := await upload_file.read(1024 * 1024):
            size += len(chunk)
            if size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
                os.remove(file_path)
                raise ValueError(
                    f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit"
                )
            f.write(chunk)

    return file_path, size


def detect_file_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    type_map = {
        ".csv": "csv",
        ".xlsx": "xlsx",
        ".xls": "xlsx",
        ".parquet": "parquet",
        ".pq": "parquet",
    }
    file_type = type_map.get(ext)
    if not file_type:
        raise ValueError(f"Unsupported file type: {ext}")
    return file_type


def get_version_path(dataset_id: str, version: int, ext: str = "csv") -> str:
    upload_dir = ensure_upload_dir(dataset_id)
    return os.path.join(upload_dir, f"v{version}.{ext}")
