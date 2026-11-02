from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import engine, Base
import app.models  # noqa: F401 - Register models with Base

# Import all API routers
from app.routes import (
    auth,
    animals,
    events,
    symptoms,
    reminders,
    vets,
    sync,
    cases,
    sos,
    village_clusters,
    family,
    learning,
    copilot,
)

# Create tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Offline-First, Multilingual AI Livestock Health & Early Warning API (PRD F1-F8)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure Cross-Origin Resource Sharing (CORS) for the frontend PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core feature routers
app.include_router(auth.router)
app.include_router(animals.router)
app.include_router(events.router)
app.include_router(symptoms.router)
app.include_router(reminders.router)
app.include_router(vets.router)
app.include_router(sync.router)

# Include Innovation Pillar routers
app.include_router(cases.router)
app.include_router(sos.router)
app.include_router(village_clusters.router)
app.include_router(family.router)
app.include_router(learning.router)
app.include_router(copilot.router)


@app.get("/", tags=["General"])
def root():
    """Welcome endpoint confirming API is running."""
    return {
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "docs_url": "/docs",
        "status": "online",
        "version": "1.0.0",
        "tagline": "From First Symptom to Documented Recovery",
    }


@app.get("/api/v1/health", tags=["Health"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.APP_ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
