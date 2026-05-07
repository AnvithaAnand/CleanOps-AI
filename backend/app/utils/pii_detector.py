import re

PII_PATTERNS = {
    "email": re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"),
    "phone": re.compile(r"^[\+]?[\d\s\-\(\)]{7,15}$"),
    "ssn": re.compile(r"^\d{3}-\d{2}-\d{4}$"),
    "credit_card": re.compile(r"^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$"),
    "ip_address": re.compile(
        r"^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$"
    ),
}

PII_COLUMN_HINTS = {
    "email": ["email", "e_mail", "e-mail", "email_address"],
    "phone": ["phone", "telephone", "mobile", "cell", "phone_number"],
    "ssn": ["ssn", "social_security", "social_security_number"],
    "credit_card": ["credit_card", "card_number", "cc_number"],
    "ip_address": ["ip", "ip_address", "ipaddress"],
}


def detect_pii(series, column_name: str = "") -> str | None:
    col_lower = column_name.lower().replace(" ", "_")
    for pii_type, hints in PII_COLUMN_HINTS.items():
        if any(hint in col_lower for hint in hints):
            return pii_type

    non_null = series.dropna().astype(str)
    if len(non_null) == 0:
        return None

    sample = non_null.head(100)
    for pii_type, pattern in PII_PATTERNS.items():
        match_rate = sample.apply(lambda x: bool(pattern.match(str(x)))).mean()
        if match_rate > 0.5:
            return pii_type

    return None
