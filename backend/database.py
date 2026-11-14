"""SQLite database configuration for Foodies Restaurant.

The connection string and schema are intentionally unchanged: a single
SQLite file in the project root, accessed through SQLAlchemy sessions.
"""

from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.getenv("FOODIES_DB", str(BASE_DIR / "foodies.db")))

DATABASE_URL = f"sqlite:///{DB_PATH}"

# check_same_thread=False is required because FastAPI serves requests
# from a thread pool while SQLite connections are created per request.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Declarative base shared by every model."""


def get_db():
    """FastAPI dependency that yields a request-scoped session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
