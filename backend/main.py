"""
Main entrypoint for Vercel deployment and standard ASGI runners.
Exposes the FastAPI instance `app`.
"""
import os
import sys
import traceback

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="PASHU PULSE API")

_startup_status = {}

try:
    from app.main import app as _actual_app
    app = _actual_app
    _startup_status = {"status": "imported_successfully"}
except Exception as _err:
    _startup_status = {
        "status": "failed",
        "error": str(_err),
        "traceback": traceback.format_exc(),
        "backend_dir": backend_dir,
        "sys_path": sys.path,
        "files_in_backend_dir": os.listdir(backend_dir) if os.path.exists(backend_dir) else [],
    }

@app.get("/api/debug-status")
@app.get("/debug-status")
def debug_status():
    return _startup_status

__all__ = ["app"]
