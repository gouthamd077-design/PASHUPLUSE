import os
import tempfile
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

logger = logging.getLogger("pashupulse.db")

Base = declarative_base()
_db_initialized = False


def build_engine():
    """Builds a database engine with non-blocking initialization, 3s timeout for cloud Postgres, and safe serverless fallback."""
    raw_url = (
        settings.DATABASE_URL
        or settings.POSTGRES_PRISMA_URL
        or settings.POSTGRES_URL
    )

    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        sqlite_fallback = f"sqlite:///{os.path.join(tempfile.gettempdir(), 'pashupulse.db')}"
    else:
        sqlite_fallback = "sqlite:///./pashupulse.db"

    # If Postgres/Supabase URL is present, attempt connection with a strict 3s timeout
    if raw_url and ("postgres" in raw_url):
        db_url = raw_url
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)

        connect_args = {
            "connect_timeout": 3,
        }
        if "sslmode" not in db_url:
            connect_args["sslmode"] = "require"

        try:
            pg_engine = create_engine(
                db_url,
                connect_args=connect_args,
                pool_pre_ping=True,
                echo=False,
            )
            with pg_engine.connect() as conn:
                pass
            logger.info("Successfully connected to Supabase / PostgreSQL database.")
            return pg_engine
        except (Exception, BaseException) as err:
            logger.warning(
                f"PostgreSQL connection failed ({err}). Falling back to local writable SQLite ({sqlite_fallback})."
            )

    # Local or serverless SQLite fallback
    return create_engine(
        sqlite_fallback,
        connect_args={"check_same_thread": False},
        echo=False,
    )


engine = build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Lazily create all tables in the database if they do not exist."""
    global _db_initialized
    if _db_initialized:
        return
    try:
        import app.models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        _db_initialized = True
    except (Exception, BaseException) as e:
        logger.warning(f"Database table check notice: {e}")


def get_db():
    """FastAPI dependency that yields a database session and handles rollbacks cleanly."""
    global _db_initialized
    if not _db_initialized:
        init_db()

    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
