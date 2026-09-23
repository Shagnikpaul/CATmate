"""FastAPI app entrypoint, router includes, and WebSocket setup."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import (
    auth_router,
    tasks_router,
    machines_router,
    incidents_router,
    training_router,
    behavior_router,
    predictions_router,
    assistant_router,
    manager_router,
    ws_router
)

app = FastAPI(
    title="CatMate API",
    description="Voice-first wellness and operations assistant for CAT machine operators and site managers.",
    version="1.0.0"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(machines_router, prefix="/api")
app.include_router(incidents_router, prefix="/api")
app.include_router(training_router, prefix="/api")
app.include_router(behavior_router, prefix="/api")
app.include_router(predictions_router, prefix="/api")
app.include_router(assistant_router, prefix="/api")
app.include_router(manager_router, prefix="/api")

# Include WebSockets
app.include_router(ws_router)

@app.get("/")
def root():
    return {
        "name": "CatMate API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
