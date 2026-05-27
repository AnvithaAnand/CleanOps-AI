from fastapi import APIRouter

from app.api.ai import router as ai_router
from app.api.alerts import router as alerts_router
from app.api.auth_router import router as auth_router
from app.api.contracts import router as contracts_router
from app.api.schedules import router as schedules_router
from app.api.pipeline import router as pipeline_router
from app.api.activity import router as activity_router
from app.api.auto_repair import router as auto_repair_router
from app.api.notifications import router as notifications_router
from app.api.datasets import router as datasets_router
from app.api.health import router as health_router
from app.api.jobs import router as jobs_router
from app.api.rules import router as rules_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(datasets_router)
api_router.include_router(rules_router)
api_router.include_router(ai_router)
api_router.include_router(jobs_router)
api_router.include_router(alerts_router)
api_router.include_router(contracts_router)
api_router.include_router(schedules_router)
api_router.include_router(pipeline_router)
api_router.include_router(activity_router)
api_router.include_router(auto_repair_router)
api_router.include_router(notifications_router)
