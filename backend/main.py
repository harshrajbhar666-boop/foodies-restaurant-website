"""Foodies Restaurant — FastAPI application.

API surface (unchanged contract, additive endpoints only):

    POST   /orders                  create an order
    GET    /orders                  list orders (newest first, optional ?phone=)
    GET    /orders/{order_id}       single order
    PATCH  /orders/{order_id}/status  update kitchen status
    GET    /health                  liveness probe

The redesigned frontend is served from the same origin at "/", so the browser
calls ``/orders`` with no CORS dance in production. CORS stays enabled for the
case where the static files are opened from another dev server.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Order, OrderItem
from .schemas import OrderCreate, OrderOut, StatusUpdate

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="Foodies Restaurant API",
    description="Order creation and order history for the Foodies Restaurant website.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# SQLite file + tables are created on first boot; existing data is kept.
# Called at import time as well so any runner (uvicorn, tests, scripts) works.
Base.metadata.create_all(bind=engine)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


# --------------------------------------------------------------------------- #
# Orders
# --------------------------------------------------------------------------- #
@app.post("/orders", response_model=OrderOut, status_code=201, tags=["orders"])
def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> Order:
    """Create an order from the cart and return the stored record."""
    if payload.order_type == "delivery" and not (payload.address or "").strip():
        raise HTTPException(status_code=422, detail="Delivery address is required for delivery orders.")

    # Totals are always computed on the server so the stored amount is trusted.
    total = round(sum(item.price * item.quantity for item in payload.items), 2)

    order = Order(
        customer_name=payload.customer_name,
        phone=payload.phone,
        address=(payload.address or "").strip() or None,
        order_type=payload.order_type,
        notes=(payload.notes or "").strip() or None,
        total=total,
        status="pending",
    )
    order.items = [
        OrderItem(
            dish_id=item.dish_id,
            name=item.name,
            price=item.price,
            quantity=item.quantity,
        )
        for item in payload.items
    ]

    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@app.get("/orders", response_model=list[OrderOut], tags=["orders"])
def list_orders(
    phone: str | None = Query(default=None, description="Filter by customer phone number"),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[Order]:
    """Order history, newest first."""
    stmt = select(Order).order_by(Order.created_at.desc(), Order.id.desc()).limit(limit)
    if phone:
        stmt = stmt.where(Order.phone == phone.strip().replace(" ", "").replace("-", ""))
    return list(db.scalars(stmt).unique())


@app.get("/orders/{order_id}", response_model=OrderOut, tags=["orders"])
def get_order(order_id: int, db: Session = Depends(get_db)) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.patch("/orders/{order_id}/status", response_model=OrderOut, tags=["orders"])
def update_status(order_id: int, payload: StatusUpdate, db: Session = Depends(get_db)) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "foodies-restaurant"}


# --------------------------------------------------------------------------- #
# Static frontend (mounted last so it never shadows the API routes)
# --------------------------------------------------------------------------- #
if FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
