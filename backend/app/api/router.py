from fastapi import APIRouter

from app.api.ai import router as ai_router
from app.api.datasets import router as datasets_router
from app.api.health import router as health_router
from app.api.rules import router as rules_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(datasets_router)
api_router.include_router(rules_router)
api_router.include_router(ai_router)
