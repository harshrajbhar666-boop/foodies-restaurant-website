
"""Database configuration for Foodies Restaurant."""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Render/Neon PostgreSQL
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://", "postgresql://", 1
    )
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg://", 1
    )
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
else:
    # Local development SQLite
    DB_PATH = Path(os.getenv("FOODIES_DB", str(BASE_DIR / "foodies.db")))
    engine = create_engine(
        f"sqlite:///{DB_PATH}",
        connect_args={"check_same_thread": False},
        future=True,
    )

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True,
)


class Base(DeclarativeBase):
    """Declarative base shared by every model."""


def get_db():
    """Provide a request-scoped database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
