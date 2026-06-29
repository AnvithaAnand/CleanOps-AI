import httpx
from app.config import settings

_SEVERITY_COLORS = {
    "critical": "#ef4444",
    "warning": "#f59e0b",
    "info": "#6366f1",
}

_HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;overflow:hidden;">
    <div style="padding:20px 24px;background:{color};background:linear-gradient(135deg,{color}22,{color}11);border-bottom:1px solid {color}44;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:10px;height:10px;border-radius:50%;background:{color};box-shadow:0 0 8px {color};"></div>
        <span style="font-size:11px;font-weight:700;letter-spacing:1px;color:{color};text-transform:uppercase;">{severity} Alert</span>
      </div>
      <h2 style="margin:8px 0 0;font-size:18px;font-weight:700;color:#ffffff;">{title}</h2>
    </div>
    <div style="padding:20px 24px;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:#a0a0c0;">{message}</p>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #2a2a4a;">
      <p style="margin:0;font-size:11px;color:#4a4a6a;">
        Sent by <strong style="color:#6366f1;">CleanOps AI</strong> &mdash;
        <a href="#" style="color:#6366f1;text-decoration:none;">View Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>
"""


async def send_alert_email(to_email: str, title: str, message: str, severity: str) -> bool:
    if not settings.RESEND_API_KEY:
        return False

    color = _SEVERITY_COLORS.get(severity, _SEVERITY_COLORS["info"])
    html = _HTML_TEMPLATE.format(
        color=color,
        severity=severity.upper(),
        title=title,
        message=message,
    )

    from_email = settings.RESEND_FROM_EMAIL or "onboarding@resend.dev"

    payload = {
        "from": f"CleanOps AI <{from_email}>",
        "to": [to_email],
        "subject": f"[CleanOps] {severity.upper()}: {title}",
        "text": message,
        "html": html,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
            return resp.status_code == 200
    except Exception:
        return False
