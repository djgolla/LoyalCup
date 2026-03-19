"""
API routes for the LoyalCup API.
Each module defines endpoints for a specific resource.
"""
from app.routes import auth, users, shops, menu, orders, loyalty, admin, payments, pos

__all__ = [
    "auth", "users", "shops", "menu", "orders", "loyalty", "admin", "payments",
    "pos", "pos_status", "pos_connect", "pos_square_webhook", "billing", "reviews",
]