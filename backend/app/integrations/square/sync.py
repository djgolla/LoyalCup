"""
Square catalog sync: maps Square's raw catalog objects into LoyalCup's
menu_categories, menu_items, modifier_groups, and modifier_options tables.
Supports upsert so re-syncing is always safe.
"""
import uuid
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def _cents_to_dollars(cents: Optional[int]) -> float:
    """Convert cents to dollars. Returns 0.0 if None."""
    if cents is None:
        return 0.0
    return round(cents / 100, 2)


async def sync_square_catalog(
    shop_id: str,
    catalog_objects: List[Dict[str, Any]],
    db,
    source: str = "square"
) -> Dict[str, Any]:
    """
    Takes raw Square catalog objects and upserts them into LoyalCup's DB.
    Returns a summary of what was synced.
    """
    client = db.service_client

    # ---------- SEPARATE OBJECT TYPES ----------
    raw_categories: List[Dict] = []
    raw_items: List[Dict] = []
    raw_modifier_lists: List[Dict] = []
    raw_images: Dict[str, str] = {}  # id -> url

    for obj in catalog_objects:
        t = obj.get("type")
        if t == "CATEGORY":
            raw_categories.append(obj)
        elif t == "ITEM":
            raw_items.append(obj)
        elif t == "MODIFIER_LIST":
            raw_modifier_lists.append(obj)
        elif t == "IMAGE":
            img_data = obj.get("image_data", {})
            url = img_data.get("url")
            if url:
                raw_images[obj["id"]] = url

    # ---------- SYNC CATEGORIES ----------
    category_pos_id_to_lc_id: Dict[str, str] = {}
    categories_synced = 0

    for cat in raw_categories:
        pos_id = cat["id"]
        cat_data = cat.get("category_data", {})
        name = cat_data.get("name") or "Uncategorized"
        lc_id = str(uuid.uuid4())

        existing = client.table("menu_categories") \
            .select("id") \
            .eq("shop_id", shop_id) \
            .eq("pos_id", pos_id) \
            .limit(1) \
            .execute()

        if existing.data:
            lc_id = existing.data[0]["id"]
            client.table("menu_categories").update({
                "name": name,
                "pos_source": source,
            }).eq("id", lc_id).execute()
        else:
            client.table("menu_categories").insert({
                "id": lc_id,
                "shop_id": shop_id,
                "name": name,
                "pos_id": pos_id,
                "pos_source": source,
                "sort_order": categories_synced,
                "is_active": True,
            }).execute()

        category_pos_id_to_lc_id[pos_id] = lc_id
        categories_synced += 1
        logger.info(f"[sync] category upserted: {name} (pos_id={pos_id})")

    # ---------- SYNC MODIFIER GROUPS ----------
    modifier_list_pos_id_to_lc_id: Dict[str, str] = {}
    modifier_groups_synced = 0

    for ml in raw_modifier_lists:
        pos_id = ml["id"]
        ml_data = ml.get("modifier_list_data", {})
        name = ml_data.get("name") or "Options"
        selection_type = ml_data.get("selection_type", "MULTIPLE")
        is_single = selection_type == "SINGLE"
        lc_id = str(uuid.uuid4())

        existing = client.table("modifier_groups") \
            .select("id") \
            .eq("shop_id", shop_id) \
            .eq("pos_id", pos_id) \
            .limit(1) \
            .execute()

        if existing.data:
            lc_id = existing.data[0]["id"]
            client.table("modifier_groups").update({
                "name": name,
                "min_selections": 1 if is_single else 0,
                "max_selections": 1 if is_single else None,
                "pos_source": source,
            }).eq("id", lc_id).execute()
        else:
            client.table("modifier_groups").insert({
                "id": lc_id,
                "shop_id": shop_id,
                "name": name,
                "min_selections": 1 if is_single else 0,
                "max_selections": 1 if is_single else None,
                "pos_id": pos_id,
                "pos_source": source,
                "is_active": True,
            }).execute()

        modifier_list_pos_id_to_lc_id[pos_id] = lc_id
        modifier_groups_synced += 1

        # Sync individual modifier options within this list
        for mod in ml_data.get("modifiers") or []:
            mod_data = mod.get("modifier_data", {})
            mod_pos_id = mod.get("uid") or mod.get("id") or str(uuid.uuid4())
            mod_name = mod_data.get("name") or "Option"
            price_money = mod_data.get("price_money")
            price = _cents_to_dollars(price_money.get("amount") if price_money else None)

            existing_mod = client.table("modifier_options") \
                .select("id") \
                .eq("modifier_group_id", lc_id) \
                .eq("pos_id", mod_pos_id) \
                .limit(1) \
                .execute()

            if existing_mod.data:
                client.table("modifier_options").update({
                    "name": mod_name,
                    "price_adjustment": price,
                    "pos_source": source,
                }).eq("id", existing_mod.data[0]["id"]).execute()
            else:
                client.table("modifier_options").insert({
                    "id": str(uuid.uuid4()),
                    "modifier_group_id": lc_id,
                    "shop_id": shop_id,
                    "name": mod_name,
                    "price_adjustment": price,
                    "pos_id": mod_pos_id,
                    "pos_source": source,
                    "is_active": True,
                }).execute()

    # ---------- SYNC ITEMS ----------
    items_synced = 0

    for item in raw_items:
        pos_id = item["id"]
        item_data = item.get("item_data", {})
        name = item_data.get("name") or "Item"
        description = item_data.get("description")

        # Resolve category
        category_lc_id = None
        reporting_cat = item_data.get("reporting_category") or item_data.get("category")
        if reporting_cat:
            cat_pos_id = reporting_cat.get("id")
            category_lc_id = category_pos_id_to_lc_id.get(cat_pos_id)
        if not category_lc_id:
            for c in (item_data.get("categories") or []):
                found = category_pos_id_to_lc_id.get(c.get("id"))
                if found:
                    category_lc_id = found
                    break

        # Price: use first variation — default to 0.0 if missing (NOT NULL safe)
        price: float = 0.0
        variations = item_data.get("variations") or []
        if variations:
            first_var = variations[0]
            var_data = first_var.get("item_variation_data", {})
            price_money = var_data.get("price_money")
            if price_money:
                price = _cents_to_dollars(price_money.get("amount"))

        # Image
        image_url = None
        for img_id in (item_data.get("image_ids") or []):
            url = raw_images.get(img_id)
            if url:
                image_url = url
                break

        # Modifier groups
        lc_modifier_group_ids = [
            modifier_list_pos_id_to_lc_id[mid]
            for mid in [
                ml_ref.get("modifier_list_id")
                for ml_ref in (item_data.get("modifier_list_info") or [])
            ]
            if mid and mid in modifier_list_pos_id_to_lc_id
        ]

        lc_id = str(uuid.uuid4())

        existing = client.table("menu_items") \
            .select("id") \
            .eq("shop_id", shop_id) \
            .eq("pos_id", pos_id) \
            .limit(1) \
            .execute()

        if existing.data:
            lc_id = existing.data[0]["id"]
            client.table("menu_items").update({
                "name": name,
                "description": description,
                "base_price": price,           # always a float now, never None
                "image_url": image_url,
                "category_id": category_lc_id,
                "pos_source": source,
                "modifier_group_ids": lc_modifier_group_ids,
            }).eq("id", lc_id).execute()
        else:
            client.table("menu_items").insert({
                "id": lc_id,
                "shop_id": shop_id,
                "name": name,
                "description": description,
                "base_price": price,           # always a float now, never None
                "image_url": image_url,
                "category_id": category_lc_id,
                "pos_id": pos_id,
                "pos_source": source,
                "modifier_group_ids": lc_modifier_group_ids,
                "is_available": True,
                "is_active": True,
            }).execute()

        items_synced += 1
        logger.info(f"[sync] item upserted: {name} @ ${price} (pos_id={pos_id})")

    summary = {
        "categories_synced": categories_synced,
        "modifier_groups_synced": modifier_groups_synced,
        "items_synced": items_synced,
    }
    logger.info(f"[sync] Square catalog sync complete for shop {shop_id}: {summary}")
    return summary