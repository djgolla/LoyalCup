"""
Square order + payment flow.

Every LoyalCup order is pushed to Square as a real OPEN order with a
PICKUP fulfillment block and a ticket named "MOBILE ...". The fulfillment
block is what makes the order route into the shop's Square Orders workflow
and print at their receipt/kitchen station like any normal online order.

Reliability:
  - Idempotency keys are derived from loyalcup_order_id so any network retry
    of the exact same order never creates a duplicate Square order/charge.
  - push_order_to_pos() raises on failure when the shop HAS a Square
    connection — the caller must treat a failure as fatal so we never record
    an order as placed when it didn't actually reach the shop.
  - If the shop has no Square connection at all, push returns None (caller
    decides whether that's allowed, e.g. pure in-person cash).
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from app.integrations.square.adapter import SquareAdapter

logger  = logging.getLogger(__name__)
_square = SquareAdapter()


# ── Public API ───────────────────────────────────────────────────────────────

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
    Full atomic Square payment flow (card / loyalty-comped).
    Creates the Square order (with PICKUP fulfillment) then charges the card.
    Raises on any failure so the caller can fail the checkout loudly.
    """
    conn = await _get_square_connection(db, shop_id)
    prep_minutes = await _get_prep_minutes(db, shop_id)
    return await _process_square_payment(
        db=db,
        conn=conn,
        shop_id=shop_id,
        loyalcup_order_id=loyalcup_order_id,
        items=items,
        payment_nonce=payment_nonce,
        loyalty_discount_cents=loyalty_discount_cents,
        customer_note=customer_note,
        prep_minutes=prep_minutes,
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
    Push an order to Square POS without charging (cash / in-person).

    Returns the Square order id on success.
    Returns None ONLY when the shop has no connected Square (nothing to push to).
    RAISES on a real submission failure when a connection exists — the caller
    MUST treat that as fatal so we never tell a customer the order succeeded
    when it never reached the shop.
    """
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
        logger.info(f"[POS] shop {shop_id} has no active Square — nothing to push")
        return None

    conn = conn_resp.data[0]
    if conn.get("provider") != "square":
        raise ValueError(f"POS provider '{conn.get('provider')}' is not supported")
    if not conn.get("location_id"):
        raise ValueError(
            "Square location not set for this shop. The owner must select a "
            "Square location in settings before orders can be sent."
        )

    prep_minutes = await _get_prep_minutes(db, shop_id)
    return await _create_square_order(
        db=db,
        conn=conn,
        loyalcup_order_id=loyalcup_order_id,
        items=items,
        customer_note=customer_note,
        prep_minutes=prep_minutes,
    )


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
            "The shop owner must connect Square before accepting orders."
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


async def _get_prep_minutes(db, shop_id: str) -> int:
    try:
        resp = (
            db.get_service_client()
            .table("shops")
            .select("avg_prep_time_minutes")
            .eq("id", shop_id)
            .limit(1)
            .execute()
        )
        if resp.data and resp.data[0].get("avg_prep_time_minutes"):
            return int(resp.data[0]["avg_prep_time_minutes"])
    except Exception as e:
        logger.warning(f"[POS] Could not read prep time for shop {shop_id}: {e}")
    return 10  # safe default


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


def _build_order_payload(
    *,
    line_items: List[Dict[str, Any]],
    loyalcup_order_id: str,
    customer_note: Optional[str],
    prep_minutes: int,
) -> Dict[str, Any]:
    """
    Build the Square order body with a PICKUP fulfillment so it lands in the
    shop's Orders workflow / printer, and a "MOBILE" ticket name so the printed
    receipt obviously reads as a mobile order.
    """
    short_id   = (loyalcup_order_id or "").replace("-", "")[:6].upper()
    ticket     = f"MOBILE #{short_id}" if short_id else "MOBILE"
    pickup_at  = (datetime.now(timezone.utc) + timedelta(minutes=prep_minutes)).isoformat()

    payload: Dict[str, Any] = {
        "line_items":   line_items,
        "reference_id": loyalcup_order_id,
        "ticket_name":  ticket,                 # prints on the receipt
        "state":        "OPEN",
        "fulfillments": [
            {
                "type":  "PICKUP",
                "state": "PROPOSED",
                "pickup_details": {
                    "recipient":     {"display_name": ticket},
                    "schedule_type": "ASAP",
                    "pickup_at":     pickup_at,
                    "note":          "Mobile order placed via LoyalCup",
                },
            }
        ],
    }
    if customer_note:
        payload["customer_note"] = customer_note
    return payload


async def _create_square_order(
    *,
    db,
    conn: Dict[str, Any],
    loyalcup_order_id: str,
    items: List[Dict[str, Any]],
    customer_note: Optional[str],
    prep_minutes: int,
) -> str:
    """Create the OPEN Square order (no charge). Raises on failure."""
    access_token = conn["access_token"]
    location_id  = conn["location_id"]

    line_items = await _build_square_line_items(db, items)
    order_payload = _build_order_payload(
        line_items=line_items,
        loyalcup_order_id=loyalcup_order_id,
        customer_note=customer_note,
        prep_minutes=prep_minutes,
    )

    result = await _square.create_order(
        access_token=access_token,
        location_id=location_id,
        order_payload=order_payload,
        idempotency_key=f"{loyalcup_order_id}-create",
    )
    square_order_id = result.get("order", {}).get("id")
    if not square_order_id:
        raise RuntimeError("Square accepted the request but returned no order id")

    logger.info(f"[Square] Order sent: loyalcup={loyalcup_order_id} square={square_order_id}")
    return square_order_id


async def _process_square_payment(
    *,
    db,
    conn: Dict[str, Any],
    shop_id: str,
    loyalcup_order_id: str,
    items: List[Dict[str, Any]],
    payment_nonce: str,
    loyalty_discount_cents: int,
    customer_note: Optional[str],
    prep_minutes: int,
) -> Dict[str, Any]:
    access_token = conn["access_token"]
    location_id  = conn["location_id"]

    line_items = await _build_square_line_items(db, items)
    order_payload = _build_order_payload(
        line_items=line_items,
        loyalcup_order_id=loyalcup_order_id,
        customer_note=customer_note,
        prep_minutes=prep_minutes,
    )

    logger.info(f"[Square] Creating order for loyalcup_order_id={loyalcup_order_id}")
    order_result = await _square.create_order(
        access_token=access_token,
        location_id=location_id,
        order_payload=order_payload,
        idempotency_key=f"{loyalcup_order_id}-create",
    )
    square_order    = order_result.get("order", {})
    square_order_id = square_order.get("id")
    if not square_order_id:
        raise RuntimeError("Square accepted the order request but returned no order id")

    total_money = square_order.get("total_money", {})
    total_cents = total_money.get("amount", 0)
    currency    = total_money.get("currency", "USD")
    tax_cents   = (square_order.get("total_tax_money") or {}).get("amount", 0)

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

    # ── Charge card (idempotent — a retry returns the same payment) ────────
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
            f"Payment not completed. Square status: {payment_status}. ID: {square_payment_id}"
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