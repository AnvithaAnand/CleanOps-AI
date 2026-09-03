from fastapi import Depends

from app.auth import get_current_user
from app.api.ai import router as ai_router
from app.api.alerts import router as alerts_router
from app.api.auth_router import router as auth_router
from app.api.contracts import router as contracts_router
from app.api.schedules import router as schedules_router
from app.api.pipeline import router as pipeline_router
from app.api.activity import router as activity_router
from app.api.auto_repair import router as auto_repair_router
from app.api.notifications import router as notifications_router
from app.api.webhooks import router as webhooks_router
from app.api.datasets import router as datasets_router
from app.api.health import router as health_router
from app.api.jobs import router as jobs_router
from app.api.rules import router as rules_router

_auth = [Depends(get_current_user)]

# Public routers (no auth)
public_routers = [health_router, auth_router]

# Protected routers (require auth)
protected_routers = [
    datasets_router,
    rules_router,
    ai_router,
    jobs_router,
    alerts_router,
    contracts_router,
    schedules_router,
    pipeline_router,
    activity_router,
    auto_repair_router,
    notifications_router,
    webhooks_router,
]


def register_routers(app):
    for r in public_routers:
        app.include_router(r)
    for r in protected_routers:
        app.include_router(r, dependencies=_auth)
