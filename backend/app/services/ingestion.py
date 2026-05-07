import pandas as pd


def parse_file(file_path: str, file_type: str) -> pd.DataFrame:
    readers = {
        "csv": lambda: pd.read_csv(file_path, low_memory=False),
        "xlsx": lambda: pd.read_excel(file_path, engine="openpyxl"),
        "parquet": lambda: pd.read_parquet(file_path),
    }
    reader = readers.get(file_type)
    if not reader:
        raise ValueError(f"Unsupported file type: {file_type}")
    return reader()
