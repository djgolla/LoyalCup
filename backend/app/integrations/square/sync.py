"""
Square catalog sync: maps Square's raw catalog objects into LoyalCup's live DB:
  categories, menu_items, modifier_groups, modifier_options.

Schema notes (live Supabase, NOT the older repo migrations):
  - categories(id, shop_id, name, display_order, description, pos_id, pos_source)
    * pos_id / pos_source added by the migration; used for idempotent re-sync.
    * NO is_active column. NO sort_order column (it's display_order).
  - menu_items.category_id REFERENCES categories(id)  ← FK lives on this table
  - menu_items(.., pos_id, pos_source, modifier_group_ids, is_active, is_available, is_out_of_stock)
  - modifier_groups(.., min_selections, max_selections, pos_id, pos_source, is_active)
  - modifier_options(.., modifier_group_id, shop_id, name, price_adjustment, pos_id, pos_source, is_active)

Idempotent: every entity is matched on (shop_id, pos_id) and upserted.
"""
import uuid
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def _cents_to_dollars(cents: Optional[int]) -> float:
    if cents is None:
        return 0.0
    return round(cents / 100, 2)


async def sync_square_catalog(
    shop_id: str,
    catalog_objects: List[Dict[str, Any]],
    db,
    source: str = "square",
    images_by_id: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    Takes raw Square catalog objects and upserts them into LoyalCup's DB.
    Returns a summary of what was synced.
    """
    client = db.service_client

    raw_categories:     List[Dict] = []
    raw_items:          List[Dict] = []
    raw_modifier_lists: List[Dict] = []
    raw_images:         Dict[str, str] = dict(images_by_id or {})

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

    # ── SYNC CATEGORIES ──────────────────────────────────────────────────────
    category_pos_id_to_lc_id: Dict[str, str] = {}
    categories_synced = 0

    for cat in raw_categories:
        pos_id   = cat["id"]
        cat_data = cat.get("category_data", {})
        name     = cat_data.get("name") or "Uncategorized"

        existing = (
            client.table("categories")
            .select("id")
            .eq("shop_id", shop_id)
            .eq("pos_id", pos_id)
            .limit(1)
            .execute()
        )

        if existing.data:
            lc_id = existing.data[0]["id"]
            client.table("categories").update({
                "name":       name,
                "pos_source": source,
            }).eq("id", lc_id).execute()
        else:
            lc_id = str(uuid.uuid4())
            client.table("categories").insert({
                "id":            lc_id,
                "shop_id":       shop_id,
                "name":          name,
                "pos_id":        pos_id,
                "pos_source":    source,
                "display_order": categories_synced,
            }).execute()

        category_pos_id_to_lc_id[pos_id] = lc_id
        categories_synced += 1
        logger.info(f"[sync] category: {name} (pos_id={pos_id})")

    # ── SYNC MODIFIER GROUPS ─────────────────────────────────────────────────
    modifier_list_pos_id_to_lc_id: Dict[str, str] = {}
    modifier_groups_synced = 0
    modifier_options_synced = 0

    for ml in raw_modifier_lists:
        pos_id    = ml["id"]
        ml_data   = ml.get("modifier_list_data", {})
        name      = ml_data.get("name") or "Options"
        is_single = ml_data.get("selection_type", "MULTIPLE") == "SINGLE"

        existing = (
            client.table("modifier_groups")
            .select("id")
            .eq("shop_id", shop_id)
            .eq("pos_id", pos_id)
            .limit(1)
            .execute()
        )

        if existing.data:
            lc_id = existing.data[0]["id"]
            client.table("modifier_groups").update({
                "name":           name,
                "min_selections": 1 if is_single else 0,
                "max_selections": 1 if is_single else None,
                "pos_source":     source,
                "is_active":      True,
            }).eq("id", lc_id).execute()
        else:
            lc_id = str(uuid.uuid4())
            client.table("modifier_groups").insert({
                "id":             lc_id,
                "shop_id":        shop_id,
                "name":           name,
                "min_selections": 1 if is_single else 0,
                "max_selections": 1 if is_single else None,
                "pos_id":         pos_id,
                "pos_source":     source,
                "is_active":      True,
            }).execute()

        modifier_list_pos_id_to_lc_id[pos_id] = lc_id
        modifier_groups_synced += 1

        # ── modifier options ──
        for mod in ml_data.get("modifiers") or []:
            mod_pos_id = mod.get("id")
            if not mod_pos_id:
                logger.warning(f"[sync] modifier in list {pos_id} has no id, skipping")
                continue

            mod_data    = mod.get("modifier_data") or {}
            mod_name    = mod_data.get("name") or "Option"
            price_money = mod_data.get("price_money")
            price       = _cents_to_dollars(price_money.get("amount") if price_money else None)

            existing_mod = (
                client.table("modifier_options")
                .select("id")
                .eq("modifier_group_id", lc_id)
                .eq("pos_id", mod_pos_id)
                .limit(1)
                .execute()
            )

            if existing_mod.data:
                client.table("modifier_options").update({
                    "name":             mod_name,
                    "price_adjustment": price,
                    "pos_source":       source,
                    "is_active":        True,
                }).eq("id", existing_mod.data[0]["id"]).execute()
            else:
                client.table("modifier_options").insert({
                    "id":               str(uuid.uuid4()),
                    "modifier_group_id": lc_id,
                    "shop_id":          shop_id,
                    "name":             mod_name,
                    "price_adjustment": price,
                    "pos_id":           mod_pos_id,
                    "pos_source":       source,
                    "is_active":        True,
                }).execute()

            modifier_options_synced += 1

    # ── SYNC ITEMS ───────────────────────────────────────────────────────────
    items_synced = 0

    for item in raw_items:
        pos_id      = item["id"]
        item_data   = item.get("item_data", {})
        name        = item_data.get("name") or "Item"
        description = item_data.get("description")

        # Resolve category — try reporting_category first, then category, then categories[]
        category_lc_id = None
        for cat_ref in [
            item_data.get("reporting_category"),
            item_data.get("category"),
            *(item_data.get("categories") or []),
        ]:
            if not cat_ref:
                continue
            found = category_pos_id_to_lc_id.get(cat_ref.get("id"))
            if found:
                category_lc_id = found
                break

        # Price: first variation — default 0.0 (DB constraint disallows NULL)
        price: float = 0.0
        variations = item_data.get("variations") or []
        if variations:
            var_data    = variations[0].get("item_variation_data", {})
            price_money = var_data.get("price_money")
            if price_money:
                price = _cents_to_dollars(price_money.get("amount"))

        # Image — try image_ids list, then direct image_id
        image_url = None
        for img_id in (item_data.get("image_ids") or []):
            url = raw_images.get(img_id)
            if url:
                image_url = url
                break
        if not image_url and item_data.get("image_id"):
            image_url = raw_images.get(item_data.get("image_id"))

        # Linked modifier groups (enabled only)
        lc_modifier_group_ids = []
        for ml_ref in (item_data.get("modifier_list_info") or []):
            mid = ml_ref.get("modifier_list_id")
            if mid and mid in modifier_list_pos_id_to_lc_id:
                if ml_ref.get("enabled") is not False:
                    lc_modifier_group_ids.append(modifier_list_pos_id_to_lc_id[mid])

        existing = (
            client.table("menu_items")
            .select("id")
            .eq("shop_id", shop_id)
            .eq("pos_id", pos_id)
            .limit(1)
            .execute()
        )

        if existing.data:
            lc_id = existing.data[0]["id"]
            client.table("menu_items").update({
                "name":               name,
                "description":        description,
                "base_price":         price,
                "image_url":          image_url,
                "category_id":        category_lc_id,
                "pos_source":         source,
                "modifier_group_ids": lc_modifier_group_ids,
                "is_active":          True,
                "is_available":       True,
            }).eq("id", lc_id).execute()
        else:
            lc_id = str(uuid.uuid4())
            client.table("menu_items").insert({
                "id":                 lc_id,
                "shop_id":            shop_id,
                "name":               name,
                "description":        description,
                "base_price":         price,
                "image_url":          image_url,
                "category_id":        category_lc_id,
                "pos_id":             pos_id,
                "pos_source":         source,
                "modifier_group_ids": lc_modifier_group_ids,
                "is_available":       True,
                "is_active":          True,
            }).execute()

        items_synced += 1
        logger.info(f"[sync] item: {name} @ ${price} (pos_id={pos_id}, cat={category_lc_id})")

    summary = {
        "categories_synced":       categories_synced,
        "modifier_groups_synced":  modifier_groups_synced,
        "modifier_options_synced": modifier_options_synced,
        "items_synced":            items_synced,
    }
    logger.info(f"[sync] Square catalog sync complete for shop {shop_id}: {summary}")
    return summary