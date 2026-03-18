async def sync_square_catalog(shop_id, catalog_objects, db):
    # Delete existing menu rows for this shop to ensure fresh sync every time
    await db.execute_query(table="menu_categories", operation="delete", filters={"shop_id": shop_id}, use_service_role=True)
    await db.execute_query(table="menu_items", operation="delete", filters={"shop_id": shop_id}, use_service_role=True)
    await db.execute_query(table="menu_modifiers", operation="delete", filters={"shop_id": shop_id}, use_service_role=True)

    cats = [o for o in catalog_objects if o["type"] == "CATEGORY"]
    items = [o for o in catalog_objects if o["type"] == "ITEM"]
    mods = [o for o in catalog_objects if o["type"] == "MODIFIER_LIST"]
    vars_ = [o for o in catalog_objects if o["type"] == "ITEM_VARIATION"]

    # Insert categories
    for cat in cats:
        await db.execute_query(
            table="menu_categories",
            operation="insert",
            data={"shop_id": shop_id, "pos_category_id": cat["id"], "name": cat["category_data"]["name"]},
            use_service_role=True
        )

    # Insert modifiers
    for mod in mods:
        await db.execute_query(
            table="menu_modifiers",
            operation="insert",
            data={"shop_id": shop_id, "pos_modifier_id": mod["id"], "name": mod["modifier_list_data"]["name"]},
            use_service_role=True
        )

    # Insert items with variations and prices
    for item in items:
        item_data = item["item_data"]
        cat_id = item_data.get("category_id")
        for v in item_data.get("variations", []):
            v_obj = next((obj for obj in vars_ if obj["id"] == v["id"]), {})
            price = None
            if "item_variation_data" in v_obj:
                price_money = v_obj["item_variation_data"].get("price_money", {})
                price = price_money.get("amount")
            await db.execute_query(
                table="menu_items",
                operation="insert",
                data={
                    "shop_id": shop_id,
                    "pos_item_id": item["id"],
                    "name": item_data["name"],
                    "description": item_data.get("description", ""),
                    "pos_category_id": cat_id,
                    "price": price
                },
                use_service_role=True
            )

    # TODO: Expand for modifier mapping to items if you want, or add extra price fields and metadata