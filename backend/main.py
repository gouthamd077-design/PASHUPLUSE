"""
Main entrypoint for Vercel deployment and standard ASGI runners.
Exposes the FastAPI instance `app`.
"""
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.responses import JSONResponse
import traceback

# Top-level ASGI app for Vercel AST scanner
app = FastAPI(title="PASHU PULSE API")

@app.get("/test-direct")
@app.get("/api/test-direct")
def test_direct_initial():
    return {
        "status": "ok",
        "message": "Initial ASGI runner is functional",
        "python_version": sys.version,
        "backend_dir": backend_dir,
    }

try:
    from app.main import app as _actual_app
    app = _actual_app

    @app.get("/test-direct")
    @app.get("/api/test-direct")
    def test_direct_actual():
        return {
            "status": "ok",
            "message": "Full app imported successfully",
            "python_version": sys.version,
            "backend_dir": backend_dir,
        }
except Exception as _err:
    _trace = traceback.format_exc()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"])
    def fallback_route(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "STARTUP_IMPORT_FAILED",
                "message": str(_err),
                "traceback": _trace,
            },
        )

__all__ = ["app"]
