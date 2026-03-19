"""
API routes for the LoyalCup API.
Each module defines endpoints for a specific resource.
"""
from app.routes import (
    auth,
    users,
    shops,
    menu,
    menu_sync,
    orders,
    loyalty,
    admin,
    payments,
    pos,
    pos_connect,
    pos_status,
    pos_sync,
    pos_square_callback,
    pos_square_set_location,
    pos_square_webhook,
    billing,
    reviews,
)

__all__ = [
    "auth", "users", "shops", "menu", "menu_sync", "orders", "loyalty",
    "admin", "payments", "pos", "pos_connect", "pos_status", "pos_sync",
    "pos_square_callback", "pos_square_set_location", "pos_square_webhook",
    "billing", "reviews",
]