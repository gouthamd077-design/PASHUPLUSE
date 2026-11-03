"""
Main entrypoint for Vercel deployment and standard ASGI runners.
Exposes the FastAPI instance `app`.
"""
import os
import sys

# Ensure the backend directory takes precedence so 'import app' resolves to backend/app
# and does not conflict with the root 'app/' frontend directory in Vercel monorepos.
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

__all__ = ["app"]
