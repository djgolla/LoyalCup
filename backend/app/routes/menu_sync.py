"""
Menu sync — Square catalog → Supabase (menu_categories + menu_items).
Exposes a router so main.py can register it, plus a reusable helper
called by pos_square_webhook and pos_sync.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/menu-sync", tags=["menu-sync"])


@router.get("/status")
async def menu_sync_status():
    """Simple health check so main.py include_router doesn't crash."""
    return {"status": "ok"}


# ─── Reusable helper (called from pos_sync / pos_square_webhook) ──────────────
async def sync_square_catalog(shop_id: str, catalog_objects: list, db):
    """
    Upserts Square catalog objects into Supabase.
    Uses soft-delete pattern (is_active=False) instead of hard DELETE
    so existing orders referencing items/categories don't break.
    """
    cats  = [o for o in catalog_objects if o.get("type") == "CATEGORY"]
    items = [o for o in catalog_objects if o.get("type") == "ITEM"]
    mods  = [o for o in catalog_objects if o.get("type") == "MODIFIER_LIST"]
    vars_ = [o for o in catalog_objects if o.get("type") == "ITEM_VARIATION"]

    # ── Soft-deactivate all existing POS-sourced rows for this shop ──
    await db.execute_query(
        table="categories",
        operation="update",
        filters={"shop_id": shop_id, "pos_source": "square"},
        data={"is_active": False},
        use_service_role=True,
    )
    await db.execute_query(
        table="menu_items",
        operation="update",
        filters={"shop_id": shop_id, "pos_source": "square"},
        data={"is_active": False},
        use_service_role=True,
    )

    # ── Upsert categories ────────────────────────────────────────────
    cat_id_map: dict[str, str] = {}  # square_id → supabase uuid
    for cat in cats:
        name = cat.get("category_data", {}).get("name", "Untitled")
        result = await db.execute_query(
            table="categories",
            operation="upsert",
            data={
                "shop_id":    shop_id,
                "pos_id":     cat["id"],
                "pos_source": "square",
                "name":       name,
                "is_active":  True,
            },
            upsert_conflict_column="pos_id,shop_id",
            use_service_role=True,
        )
        if result and len(result) > 0:
            cat_id_map[cat["id"]] = result[0]["id"]

    # ── Upsert modifier groups ───────────────────────────────────────
    for mod in mods:
        mod_data = mod.get("modifier_list_data", {})
        name = mod_data.get("name", "Untitled")
        options = []
        for opt in mod_data.get("modifiers", []):
            opt_data = opt.get("modifier_data", {})
            price_money = opt_data.get("price_money", {})
            price_cents = price_money.get("amount", 0) or 0
            options.append({
                "id":               opt["id"],
                "name":             opt_data.get("name", ""),
                "price_adjustment": round(price_cents / 100, 2),
                "is_active":        True,
            })

        await db.execute_query(
            table="modifier_groups",
            operation="upsert",
            data={
                "shop_id":        shop_id,
                "pos_id":         mod["id"],
                "pos_source":     "square",
                "name":           name,
                "min_selections": 0,
                "max_selections": None,
                "is_active":      True,
                "options":        options,   # stored as jsonb
            },
            upsert_conflict_column="pos_id,shop_id",
            use_service_role=True,
        )

    # ── Upsert items ─────────────────────────────────────────────────
    for item in items:
        item_data = item.get("item_data", {})
        name      = item_data.get("name", "Untitled")
        desc      = item_data.get("description", "") or ""

        # Resolve category supabase UUID from square category_id
        sq_cat_id    = item_data.get("category_id")
        supabase_cat = cat_id_map.get(sq_cat_id) if sq_cat_id else None

        # Modifier group IDs (square IDs — we store as pos refs)
        modifier_ids = item_data.get("modifier_list_info", [])
        mod_group_ids = [m["modifier_list_id"] for m in modifier_ids if m.get("enabled")]

        # Use first variation's price as base_price
        base_price = 0.0
        variations = item_data.get("variations", [])
        if variations:
            first_var_id = variations[0]["id"]
            v_obj = next((o for o in vars_ if o["id"] == first_var_id), {})
            price_money = v_obj.get("item_variation_data", {}).get("price_money", {})
            cents = price_money.get("amount", 0) or 0
            base_price = round(cents / 100, 2)

        await db.execute_query(
            table="menu_items",
            operation="upsert",
            data={
                "shop_id":           shop_id,
                "pos_id":            item["id"],
                "pos_source":        "square",
                "name":              name,
                "description":       desc,
                "category_id":       supabase_cat,
                "base_price":        base_price,
                "is_available":      True,
                "is_active":         True,
                "modifier_group_ids": mod_group_ids,
            },
            upsert_conflict_column="pos_id,shop_id",
            use_service_role=True,
        )