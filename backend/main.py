"""
Main entrypoint for Vercel deployment and standard ASGI runners.
Exposes the FastAPI instance `app`.
"""
import os
import sys

# Ensure backend directory is in sys.path
cur_dir = os.path.dirname(os.path.abspath(__file__))
if cur_dir not in sys.path:
    sys.path.insert(0, cur_dir)

from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Top-level ASGI app for Vercel AST scanner
app = FastAPI(title="PASHU PULSE API")

try:
    from app.main import app as _actual_app
    app = _actual_app
except Exception as _import_error:
    import traceback
    _trace = traceback.format_exc()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"])
    async def _catch_all(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "STARTUP_IMPORT_FAILED",
                "message": str(_import_error),
                "traceback": _trace,
                "sys_path": sys.path,
                "cur_dir": cur_dir,
            },
        )

__all__ = ["app"]
