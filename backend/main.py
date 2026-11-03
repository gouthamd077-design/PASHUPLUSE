"""
Main ASGI entrypoint for Vercel Serverless deployment and Uvicorn runners.
Exposes the FastAPI instance `app`.
"""
import sys
import traceback

try:
    from app.main import app
except Exception as exc:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    err_trace = traceback.format_exc()
    app = FastAPI(title="PASHU PULSE Diagnostic Fallback")

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"])
    def runtime_error_handler(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "COLD_START_IMPORT_FAILURE",
                "message": str(exc),
                "traceback": err_trace,
                "python_version": sys.version,
            },
        )

__all__ = ["app"]
