"""
API routes for the LoyalCup API.
Each module defines endpoints for a specific resource.
"""
from app.routes import auth, users, shops, menu, orders, loyalty

__all__ = ["auth", "users", "shops", "menu", "orders", "loyalty"]
