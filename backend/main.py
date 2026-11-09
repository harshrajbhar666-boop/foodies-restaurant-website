
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
import json

from database import get_connection, create_tables


# CREATE FASTAPI APP
app = FastAPI(
    title="Foodies Restaurant API",
    description="Backend API for Foodies Restaurant Website",
    version="2.0.0"
)


# CORS CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# CREATE DATABASE TABLES
create_tables()


# FOOD ITEM MODEL
class OrderItem(BaseModel):
    name: str
    price: float = Field(gt=0)
    quantity: int = Field(gt=0)


# CUSTOMER ORDER MODEL
class OrderCreate(BaseModel):
    name: str
    phone: str
    address: str
    items: List[OrderItem]


# HOME API
@app.get("/")
def home():
    return {
        "message": "Welcome to Foodies Restaurant Backend!",
        "status": "Running Successfully"
    }


# ABOUT API
@app.get("/about")
def about():
    return {
        "project": "Foodies Restaurant",
        "developer": "Harsh Rajbhar",
        "technology": "Python, FastAPI and SQLite"
    }


# PLACE NEW ORDER API
@app.post("/orders")
def create_order(order: OrderCreate):

    if len(order.phone) != 10 or not order.phone.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid 10 digit phone number"
        )

    if not order.name.strip() or not order.address.strip():
        raise HTTPException(
            status_code=400,
            detail="Name and address cannot be empty"
        )

    if not order.items:
        raise HTTPException(
            status_code=400,
            detail="Please add at least one food item"
        )

    total = sum(
        item.price * item.quantity
        for item in order.items
    )

    items_data = [item.dict() for item in order.items]

    current_date = datetime.now().isoformat()

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO orders
            (customer_name, phone, address, items, total, status, date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order.name.strip(),
                order.phone,
                order.address.strip(),
                json.dumps(items_data),
                total,
                "Order Placed",
                current_date
            )
        )

        order_id = cursor.lastrowid
        connection.commit()

    finally:
        connection.close()

    new_order = {
        "order_id": order_id,
        "customer_name": order.name.strip(),
        "phone": order.phone,
        "address": order.address.strip(),
        "items": items_data,
        "total": total,
        "status": "Order Placed",
        "date": current_date
    }

    return {
        "message": "Order placed successfully!",
        "order": new_order
    }


# GET ALL ORDERS API
@app.get("/orders")
def get_orders():

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            "SELECT * FROM orders ORDER BY id DESC"
        )

        rows = cursor.fetchall()

        all_orders = []

        for row in rows:
            all_orders.append({
                "order_id": row["id"],
                "customer_name": row["customer_name"],
                "phone": row["phone"],
                "address": row["address"],
                "items": json.loads(row["items"]),
                "total": row["total"],
                "status": row["status"],
                "date": row["date"]
            })

    finally:
        connection.close()

    return {
        "total_orders": len(all_orders),
        "orders": all_orders
    }
