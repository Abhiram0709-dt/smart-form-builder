from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.forms import router as forms_router
from app.api.routes.health import router as health_router
from app.api.routes.responses import router as responses_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(forms_router)
api_router.include_router(responses_router)
