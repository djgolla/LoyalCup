"""
Square payment + order flow.
Handles both charged orders (card) and fully-loyalty-comped free orders.

Idempotency keys are derived from loyalcup_order_id so that any network
retry of the exact same order never creates a duplicate charge on Square.
"""
import logging
from typing import Any, Dict, List, Optional

from app.integrations.square.adapter import SquareAdapter

logger  = logging.getLogger(__name__)
_square = SquareAdapter()


async def process_payment(
    *,
    db,
    shop_id: str,
    loyalcup_order_id: str,
    items: List[Dict[str, Any]],
    payment_nonce: str,
    loyalty_discount_cents: int = 0,
    customer_note: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Full atomic Square payment flow.
    Returns { square_order_id, square_payment_id, charged_cents, tax_cents, currency }
    square_payment_id is None for fully-comped free orders.
    """
    conn = await _get_square_connection(db, shop_id)
    return await _process_square_payment(
        db=db,
        conn=conn,
        shop_id=shop_id,
        loyalcup_order_id=loyalcup_order_id,
        items=items,
        payment_nonce=payment_nonce,
        loyalty_discount_cents=loyalty_discount_cents,
        customer_note=customer_note,
    )


async def push_order_to_pos(
    *,
    db,
    shop_id: str,
    loyalcup_order_id: str,
    items: List[Dict[str, Any]],
    customer_note: Optional[str] = None,
) -> Optional[str]:
    """
    Push an order to Square POS without charging (for cash/in-person payment).
    Returns external POS order ID or None. Non-fatal.
    """
    try:
        conn_resp = (
            db.get_service_client()
            .table("pos_connections")
            .select("provider, access_token, location_id, status")
            .eq("shop_id", shop_id)
            .eq("status", "connected")
            .limit(1)
            .execute()
        )
        if not conn_resp.data:
            logger.info(f"[POS] shop {shop_id} has no active POS — skipping push")
            return None

        conn = conn_resp.data[0]
        if conn.get("provider") == "square":
            return await _push_to_square(
                db=db,
                conn=conn,
                shop_id=shop_id,
                loyalcup_order_id=loyalcup_order_id,
                items=items,
                customer_note=customer_note,
            )

        logger.warning(f"[POS] provider '{conn.get('provider')}' not supported for push")
        return None
    except Exception as e:
        logger.exception(f"[POS] Unexpected error pushing order {loyalcup_order_id}: {e}")
        return None


# ── Private helpers ──────────────────────────────────────────────────────────

async def _get_square_connection(db, shop_id: str) -> Dict[str, Any]:
    conn_resp = (
        db.get_service_client()
        .table("pos_connections")
        .select("provider, access_token, location_id, status, refresh_token")
        .eq("shop_id", shop_id)
        .eq("status", "connected")
        .limit(1)
        .execute()
    )
    if not conn_resp.data:
        raise ValueError(
            f"Shop {shop_id} has no active Square connection. "
            "The shop owner must connect Square before accepting payments."
        )

    conn = conn_resp.data[0]

    if not conn.get("location_id"):
        raise ValueError(
            "Square location not set for this shop. "
            "The shop owner must select a Square location in settings."
        )

    if conn.get("provider") != "square":
        raise ValueError(f"Payment not supported for provider '{conn.get('provider')}'")

    return conn


async def _build_square_line_items(
    db,
    items: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    menu_item_ids = [item["menu_item_id"] for item in items]
    menu_resp = (
        db.get_service_client()
        .table("menu_items")
        .select("id, name, base_price, pos_id, pos_source")
        .in_("id", menu_item_ids)
        .execute()
    )
    menu_lookup: Dict[str, Dict] = {row["id"]: row for row in (menu_resp.data or [])}

    line_items = []
    for item in items:
        menu_row = menu_lookup.get(item["menu_item_id"])
        if not menu_row:
            logger.warning(f"[Square] menu_item {item['menu_item_id']} not in DB — skipping")
            continue

        unit_price_cents = int(round(
            float(item.get("unit_price") or menu_row.get("base_price") or 0) * 100
        ))

        line_item: Dict[str, Any] = {
            "quantity": str(max(1, item.get("quantity", 1))),
            "base_price_money": {
                "amount":   unit_price_cents,
                "currency": "USD",
            },
        }

        pos_id     = menu_row.get("pos_id")
        pos_source = (menu_row.get("pos_source") or "").lower()

        if pos_id and pos_source == "square":
            line_item["catalog_object_id"] = pos_id
        else:
            line_item["name"] = menu_row.get("name", "Item")

        customizations = item.get("customizations") or []
        modifiers = []
        for c in customizations:
            square_mod_id = (
                c.get("square_modifier_id")
                or c.get("pos_modifier_id")
                or c.get("modifier_id")
            )
            if square_mod_id:
                modifiers.append({"catalog_object_id": square_mod_id})
        if modifiers:
            line_item["modifiers"] = modifiers

        line_items.append(line_item)

    if not line_items:
        raise ValueError("No valid menu items found for this order. Items may have been removed.")

    return line_items


async def _push_to_square(
    *,
    db,
    conn: Dict[str, Any],
    shop_id: str,
    loyalcup_order_id: str,
    items: List[Dict[str, Any]],
    customer_note: Optional[str] = None,
) -> Optional[str]:
    try:
        access_token = conn["access_token"]
        location_id  = conn["location_id"]

        line_items = await _build_square_line_items(db, items)
        order_payload: Dict[str, Any] = {
            "line_items":   line_items,
            "reference_id": loyalcup_order_id,
            "state":        "OPEN",
        }
        if customer_note:
            order_payload["customer_note"] = customer_note

        result = await _square.create_order(
            access_token=access_token,
            location_id=location_id,
            order_payload=order_payload,
            idempotency_key=f"{loyalcup_order_id}-push",
        )
        square_order_id = result.get("order", {}).get("id")
        logger.info(f"[Square] Order push: loyalcup={loyalcup_order_id} square={square_order_id}")
        return square_order_id
    except Exception as e:
        logger.exception(f"[Square] Failed to push order {loyalcup_order_id}: {e}")
        return None


async def _process_square_payment(
    *,
    db,
    conn: Dict[str, Any],
    shop_id: str,
    loyalcup_order_id: str,
    items: List[Dict[str, Any]],
    payment_nonce: str,
    loyalty_discount_cents: int = 0,
    customer_note: Optional[str] = None,
) -> Dict[str, Any]:
    access_token = conn["access_token"]
    location_id  = conn["location_id"]

    # Build line items
    line_items = await _build_square_line_items(db, items)

    order_payload: Dict[str, Any] = {
        "line_items":   line_items,
        "reference_id": loyalcup_order_id,
        "state":        "OPEN",
    }
    if customer_note:
        order_payload["customer_note"] = customer_note

    # Create order → Square calculates real tax.
    # Idempotency key is tied to loyalcup_order_id — retries are safe.
    logger.info(f"[Square] Creating order for loyalcup_order_id={loyalcup_order_id}")
    order_result = await _square.create_order(
        access_token=access_token,
        location_id=location_id,
        order_payload=order_payload,
        idempotency_key=f"{loyalcup_order_id}-create",
    )
    square_order    = order_result.get("order", {})
    square_order_id = square_order.get("id")

    total_money = square_order.get("total_money", {})
    total_cents = total_money.get("amount", 0)
    currency    = total_money.get("currency", "USD")
    tax_cents   = (square_order.get("total_tax_money") or {}).get("amount", 0)

    # Apply loyalty discount — floor at 0
    charge_cents = max(0, total_cents - loyalty_discount_cents)

    logger.info(
        f"[Square] Order {square_order_id}: total={total_cents}¢  "
        f"discount={loyalty_discount_cents}¢  charge={charge_cents}¢"
    )

    # ── Free order (fully covered by loyalty) ─────────────────────────────
    if charge_cents == 0:
        logger.info(f"[Square] Order {square_order_id} fully covered by loyalty — skipping charge")
        return {
            "square_order_id":   square_order_id,
            "square_payment_id": None,
            "charged_cents":     0,
            "tax_cents":         tax_cents,
            "total_cents":       total_cents,
            "currency":          currency,
        }

    # ── Charge card ───────────────────────────────────────────────────────
    # Idempotency key is tied to loyalcup_order_id — a network retry on this
    # exact order will return the same payment result instead of double-charging.
    payment_result = await _square.charge_payment(
        access_token=access_token,
        location_id=location_id,
        source_id=payment_nonce,
        amount_cents=charge_cents,
        currency=currency,
        order_id=square_order_id,
        reference_id=loyalcup_order_id,
        customer_note=customer_note,
        idempotency_key=f"{loyalcup_order_id}-charge",
    )

    payment           = payment_result.get("payment", {})
    square_payment_id = payment.get("id")
    payment_status    = payment.get("status")

    if payment_status not in ("COMPLETED", "APPROVED"):
        raise RuntimeError(
            f"Payment not completed. Square status: {payment_status}. "
            f"ID: {square_payment_id}"
        )

    logger.info(
        f"[Square] Payment SUCCESS: payment_id={square_payment_id} "
        f"status={payment_status} charged={charge_cents}¢"
    )

    return {
        "square_order_id":   square_order_id,
        "square_payment_id": square_payment_id,
        "charged_cents":     charge_cents,
        "tax_cents":         tax_cents,
        "total_cents":       total_cents,
        "currency":          currency,
    }