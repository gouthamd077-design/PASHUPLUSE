"""
Main entrypoint for Vercel deployment and standard ASGI runners.
Exposes the FastAPI instance `app`.
"""
from app.main import app

__all__ = ["app"]
