"""Routers package."""
from app.routers.auth import router as auth_router
from app.routers.tasks import router as tasks_router
from app.routers.machines import router as machines_router
from app.routers.incidents import router as incidents_router
from app.routers.training import router as training_router
from app.routers.behavior import router as behavior_router
from app.routers.predictions import router as predictions_router
from app.routers.assistant import router as assistant_router
from app.routers.manager import router as manager_router
from app.routers.ws import router as ws_router

__all__ = [
    "auth_router",
    "tasks_router",
    "machines_router",
    "incidents_router",
    "training_router",
    "behavior_router",
    "predictions_router",
    "assistant_router",
    "manager_router",
    "ws_router"
]
