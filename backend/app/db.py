import os
import tempfile
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

logger = logging.getLogger("pashupulse.db")

Base = declarative_base()


def build_engine():
    """Builds a database engine with graceful fallback between PostgreSQL and SQLite."""
    raw_url = (
        settings.DATABASE_URL
        or settings.POSTGRES_PRISMA_URL
        or settings.POSTGRES_URL
    )

    # In serverless environments (like Vercel), the current working directory is read-only.
    # We must use /tmp for SQLite files so file writes do not raise Errno 30.
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        sqlite_fallback = f"sqlite:///{os.path.join(tempfile.gettempdir(), 'pashupulse.db')}"
    else:
        sqlite_fallback = "sqlite:///./pashupulse.db"

    # Attempt PostgreSQL / Supabase first if a postgres URL is provided
    if raw_url and ("postgres" in raw_url):
        db_url = raw_url
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)

        connect_args = {}
        # Ensure sslmode=require for cloud PostgreSQL unless already specified
        if "sslmode" not in db_url and not db_url.startswith("sqlite"):
            connect_args["sslmode"] = "require"

        try:
            pg_engine = create_engine(
                db_url,
                connect_args=connect_args,
                pool_pre_ping=True,
                echo=False,
            )
            # Verify the connection works
            with pg_engine.connect() as conn:
                pass
            logger.info("Successfully connected to Supabase / PostgreSQL database.")
            return pg_engine
        except Exception as err:
            logger.warning(
                f"PostgreSQL connection failed ({err}). Falling back to local writable SQLite ({sqlite_fallback})."
            )

    # Fallback to SQLite (using /tmp on Vercel to prevent read-only filesystem crash)
    return create_engine(
        sqlite_fallback,
        connect_args={"check_same_thread": False},
        echo=False,
    )


engine = build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create all tables in the database if they do not exist, catching errors safely."""
    try:
        import app.models  # noqa: F401
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning(f"Notice during init_db: {e}")


def get_db():
    """FastAPI dependency that yields a database session and handles rollbacks cleanly."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
