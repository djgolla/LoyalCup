"""
Square catalog sync: maps Square's raw catalog objects into LoyalCup's live DB:
  categories, menu_items, modifier_groups, modifier_options.

IMPORTANT FIX (2026-05-27):
  menu_items.pos_id now stores the Square ITEM_VARIATION id, NOT the ITEM id.
  Reason: Square's CreateOrder API requires variation ids in line_items[].catalog_object_id.
  Storing the parent ITEM id caused "item variation with catalog object id X not found"
  at checkout time.

CATEGORY FIX:
  Square can return duplicate category objects with the same visible name
  and hidden/generated categories like "Generated Template Menu".
  LoyalCup should show clean user-facing categories, so we dedupe by
  normalized category name and map every Square category id back to the
  single LoyalCup category row.

Idempotent: entities are matched on stable POS ids where appropriate.
Categories are matched by shop + normalized name first to avoid Square
duplicate category IDs creating duplicate LoyalCup categories.
"""
import uuid
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


IGNORED_CATEGORY_NAMES = {
    "generated template menu",
}


def _cents_to_dollars(cents: Optional[int]) -> float:
    if cents is None:
        return 0.0
    return round(cents / 100, 2)


def _normalize_name(value: Optional[str]) -> str:
    return " ".join((value or "").strip().lower().split())


def _get_service_client(db):
    if hasattr(db, "get_service_client"):
        return db.get_service_client()
    return db.service_client


def _item_category_refs(item_data: Dict[str, Any]) -> List[str]:
    refs: List[str] = []

    for cat_ref in [
        item_data.get("reporting_category"),
        item_data.get("category"),
        *(item_data.get("categories") or []),
    ]:
        if cat_ref and cat_ref.get("id"):
            refs.append(cat_ref["id"])

    return refs


async def sync_square_catalog(
    shop_id: str,
    catalog_objects: List[Dict[str, Any]],
    db,
    source: str = "square",
    images_by_id: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """Takes raw Square catalog objects and upserts them into LoyalCup's DB."""
    client = _get_service_client(db)

    raw_categories: List[Dict] = []
    raw_items: List[Dict] = []
    raw_modifier_lists: List[Dict] = []
    raw_images: Dict[str, str] = dict(images_by_id or {})

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

    # Build set of Square category IDs actually referenced by items.
    # This helps avoid syncing stale/hidden Square category objects that are
    # returned as related_objects but are not part of the real menu flow.
    referenced_category_pos_ids = set()
    for item in raw_items:
        item_data = item.get("item_data", {}) or {}
        for cat_id in _item_category_refs(item_data):
            referenced_category_pos_ids.add(cat_id)

    # ── CATEGORIES ───────────────────────────────────────────────────────────
    category_pos_id_to_lc_id: Dict[str, str] = {}
    category_name_to_lc_id: Dict[str, str] = {}
    categories_synced = 0

    # Keep category display order stable and clean by normalized name.
    unique_categories_by_name: Dict[str, Dict[str, Any]] = {}

    for cat in raw_categories:
        pos_id = cat.get("id")
        cat_data = cat.get("category_data", {}) or {}
        name = cat_data.get("name") or "Uncategorized"
        normalized_name = _normalize_name(name)

        if not pos_id:
            continue

        if normalized_name in IGNORED_CATEGORY_NAMES:
            logger.info(f"[sync] ignored Square category: {name} (pos_id={pos_id})")
            continue

        # If Square returned duplicate names, keep one display category but
        # still map every duplicate Square pos_id to the same LoyalCup category.
        if normalized_name not in unique_categories_by_name:
            unique_categories_by_name[normalized_name] = {
                "name": name,
                "pos_ids": [],
                "preferred_pos_id": pos_id,
                "is_referenced": pos_id in referenced_category_pos_ids,
            }

        unique_categories_by_name[normalized_name]["pos_ids"].append(pos_id)

        # Prefer the Square category id that items actually reference.
        if pos_id in referenced_category_pos_ids:
            unique_categories_by_name[normalized_name]["preferred_pos_id"] = pos_id
            unique_categories_by_name[normalized_name]["is_referenced"] = True

    for normalized_name, cat_info in unique_categories_by_name.items():
        name = cat_info["name"]
        preferred_pos_id = cat_info["preferred_pos_id"]
        all_pos_ids = cat_info["pos_ids"]

        try:
            existing_by_name = (
                client.table("categories")
                .select("id")
                .eq("shop_id", shop_id)
                .eq("is_active", True)
                .ilike("name", name)
                .limit(1)
                .execute()
            )

            if existing_by_name.data:
                lc_id = existing_by_name.data[0]["id"]
                client.table("categories").update({
                    "name": preferred_pos_id and name or name,
                    "pos_id": preferred_pos_id,
                    "pos_source": source,
                    "is_active": True,
                }).eq("id", lc_id).execute()
            else:
                existing_by_pos = (
                    client.table("categories")
                    .select("id")
                    .eq("shop_id", shop_id)
                    .eq("pos_id", preferred_pos_id)
                    .limit(1)
                    .execute()
                )

                if existing_by_pos.data:
                    lc_id = existing_by_pos.data[0]["id"]
                    client.table("categories").update({
                        "name": name,
                        "pos_source": source,
                        "is_active": True,
                    }).eq("id", lc_id).execute()
                else:
                    lc_id = str(uuid.uuid4())
                    client.table("categories").insert({
                        "id": lc_id,
                        "shop_id": shop_id,
                        "name": name,
                        "pos_id": preferred_pos_id,
                        "pos_source": source,
                        "display_order": categories_synced,
                        "is_active": True,
                    }).execute()
        except Exception as category_error:
            logger.warning(
                f"[sync] categories table unavailable for {name}; "
                f"falling back to menu_categories: {category_error}"
            )
            existing_by_name = (
                client.table("menu_categories")
                .select("id")
                .eq("shop_id", shop_id)
                .ilike("name", name)
                .limit(1)
                .execute()
            )
            if existing_by_name.data:
                lc_id = existing_by_name.data[0]["id"]
                client.table("menu_categories").update({
                    "name": name,
                    "sort_order": categories_synced,
                    "pos_category_id": preferred_pos_id,
                    "pos_id": preferred_pos_id,
                    "pos_source": source,
                }).eq("id", lc_id).execute()
            else:
                lc_id = str(uuid.uuid4())
                client.table("menu_categories").insert({
                    "id": lc_id,
                    "shop_id": shop_id,
                    "name": name,
                    "sort_order": categories_synced,
                    "pos_category_id": preferred_pos_id,
                    "pos_id": preferred_pos_id,
                    "pos_source": source,
                    "is_active": True,
                }).execute()

        category_name_to_lc_id[normalized_name] = lc_id

        for pos_id in all_pos_ids:
            category_pos_id_to_lc_id[pos_id] = lc_id

        categories_synced += 1
        logger.info(
            f"[sync] category: {name} "
            f"(lc_id={lc_id}, preferred_pos_id={preferred_pos_id}, mapped_pos_ids={len(all_pos_ids)})"
        )

    # ── MODIFIER GROUPS + OPTIONS ────────────────────────────────────────────
    modifier_list_pos_id_to_lc_id: Dict[str, str] = {}
    modifier_groups_synced = 0
    modifier_options_synced = 0

    for ml in raw_modifier_lists:
        pos_id = ml["id"]
        ml_data = ml.get("modifier_list_data", {}) or {}
        name = ml_data.get("name") or "Options"
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
                "name": name,
                "min_selections": 1 if is_single else 0,
                "max_selections": 1 if is_single else None,
                "pos_source": source,
                "is_active": True,
            }).eq("id", lc_id).execute()
        else:
            lc_id = str(uuid.uuid4())
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

        for mod in ml_data.get("modifiers") or []:
            mod_pos_id = mod.get("id")
            if not mod_pos_id:
                continue

            mod_data = mod.get("modifier_data") or {}
            mod_name = mod_data.get("name") or "Option"
            price_money = mod_data.get("price_money")
            price = _cents_to_dollars(price_money.get("amount") if price_money else None)

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
                    "name": mod_name,
                    "price_adjustment": price,
                    "pos_source": source,
                    "is_active": True,
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

            modifier_options_synced += 1

    # ── ITEMS ────────────────────────────────────────────────────────────────
    items_synced = 0

    for item in raw_items:
        item_pos_id = item["id"]
        item_data = item.get("item_data", {}) or {}
        name = item_data.get("name") or "Item"
        description = item_data.get("description")

        # Resolve category — try reporting_category, then category, then categories[]
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

        # First variation drives price + the pos_id we store.
        variations = item_data.get("variations") or []
        if not variations:
            logger.warning(f"[sync] item {name} ({item_pos_id}) has no variations — skipping")
            continue

        first_var = variations[0]
        variation_id = first_var.get("id")
        var_data = first_var.get("item_variation_data", {}) or {}
        price_money = var_data.get("price_money")
        price: float = _cents_to_dollars(price_money.get("amount")) if price_money else 0.0

        if not variation_id:
            logger.warning(f"[sync] item {name} has variation with no id — skipping")
            continue

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

        # Match on either the new variation id OR the legacy item id so re-sync
        # after this bugfix migrates existing rows in place.
        existing = (
            client.table("menu_items")
            .select("id, pos_id")
            .eq("shop_id", shop_id)
            .in_("pos_id", [variation_id, item_pos_id])
            .limit(1)
            .execute()
        )

        common_payload = {
            "name": name,
            "description": description,
            "base_price": price,
            "image_url": image_url,
            "category_id": category_lc_id,
            "pos_id": variation_id,
            "pos_source": source,
            "modifier_group_ids": lc_modifier_group_ids,
            "is_active": True,
            "is_available": True,
        }

        if existing.data:
            lc_id = existing.data[0]["id"]
            client.table("menu_items").update(common_payload).eq("id", lc_id).execute()
        else:
            common_payload["id"] = str(uuid.uuid4())
            common_payload["shop_id"] = shop_id
            client.table("menu_items").insert(common_payload).execute()

        items_synced += 1
        logger.info(
            f"[sync] item: {name} @ ${price} "
            f"(variation_id={variation_id}, cat={category_lc_id})"
        )

    summary = {
        "categories_synced": categories_synced,
        "modifier_groups_synced": modifier_groups_synced,
        "modifier_options_synced": modifier_options_synced,
        "items_synced": items_synced,
    }

    logger.info(f"[sync] Square catalog sync complete for shop {shop_id}: {summary}")
    return summary
