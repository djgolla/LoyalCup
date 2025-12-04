"""
Common database schema definitions.
These match the table structures in 001_init.sql.
"""
from typing import Dict, Any

# Table names as constants for consistency
TABLE_PROFILES = "profiles"
TABLE_SHOPS = "shops"
TABLE_MENU_CATEGORIES = "menu_categories"
TABLE_MENU_ITEMS = "menu_items"
TABLE_CUSTOMIZATION_TEMPLATES = "customization_templates"
TABLE_ORDERS = "orders"
TABLE_ORDER_ITEMS = "order_items"
TABLE_LOYALTY_BALANCES = "loyalty_balances"
TABLE_LOYALTY_REWARDS = "loyalty_rewards"
TABLE_LOYALTY_TRANSACTIONS = "loyalty_transactions"


def get_schema_info() -> Dict[str, Any]:
    """
    Get information about the database schema.
    
    Returns:
        Dictionary containing schema information
    """
    return {
        "tables": [
            TABLE_PROFILES,
            TABLE_SHOPS,
            TABLE_MENU_CATEGORIES,
            TABLE_MENU_ITEMS,
            TABLE_CUSTOMIZATION_TEMPLATES,
            TABLE_ORDERS,
            TABLE_ORDER_ITEMS,
            TABLE_LOYALTY_BALANCES,
            TABLE_LOYALTY_REWARDS,
            TABLE_LOYALTY_TRANSACTIONS,
        ],
        "version": "1.0.0",
        "migration": "001_init.sql"
    }
