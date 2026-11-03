import logging
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import engine, Base, init_db
import app.models  # noqa: F401 - Register models with Base

logger = logging.getLogger("pashupulse")

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
    passport,
)

app = FastAPI(
    title=settings.APP_NAME,
    description="Offline-First, Multilingual AI Livestock Health & Early Warning API (PRD F1-F8)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        trace = traceback.format_exc()
        logger.error(f"Global unhandled error on {request.url}: {trace}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(exc) or "Internal Server Error",
                "error_type": exc.__class__.__name__,
                "path": request.url.path,
                "traceback": trace,
            },
        )

# Configure Cross-Origin Resource Sharing (CORS) for the frontend PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core feature routers at root
app.include_router(auth.router)
app.include_router(animals.router)
app.include_router(events.router)
app.include_router(symptoms.router)
app.include_router(reminders.router)
app.include_router(vets.router)
app.include_router(sync.router)

# Include Innovation Pillar routers at root
app.include_router(cases.router)
app.include_router(sos.router)
app.include_router(village_clusters.router)
app.include_router(family.router)
app.include_router(learning.router)
app.include_router(copilot.router)
app.include_router(passport.router)

# Mount all routers under /api as well to support Vercel /api rewrites and Vite proxy
from fastapi import APIRouter
api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(animals.router)
api_router.include_router(events.router)
api_router.include_router(symptoms.router)
api_router.include_router(reminders.router)
api_router.include_router(vets.router)
api_router.include_router(sync.router)
api_router.include_router(cases.router)
api_router.include_router(sos.router)
api_router.include_router(village_clusters.router)
api_router.include_router(family.router)
api_router.include_router(learning.router)
api_router.include_router(copilot.router)
api_router.include_router(passport.router)
app.include_router(api_router)


@app.api_route("/", methods=["GET", "POST", "HEAD", "OPTIONS"], tags=["General"])
@app.api_route("/api", methods=["GET", "POST", "HEAD", "OPTIONS"], tags=["General"])
@api_router.api_route("", methods=["GET", "POST", "HEAD", "OPTIONS"], tags=["General"])
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


@app.api_route("/api/v1/health", methods=["GET", "POST", "HEAD", "OPTIONS"], tags=["Health"])
@app.api_route("/api/health", methods=["GET", "POST", "HEAD", "OPTIONS"], tags=["Health"])
@app.api_route("/health", methods=["GET", "POST", "HEAD", "OPTIONS"], tags=["Health"])
@api_router.api_route("/v1/health", methods=["GET", "POST", "HEAD", "OPTIONS"], tags=["Health"])
@api_router.api_route("/health", methods=["GET", "POST", "HEAD", "OPTIONS"], tags=["Health"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.APP_ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
