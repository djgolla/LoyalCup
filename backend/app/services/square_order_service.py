"""
Handles the full Square payment flow:
  1. Build + create an OPEN Square order (Square calculates tax at the location's rate)
  2. Charge the card using the nonce from the mobile SDK
  3. The order lands on the POS as PAID — barista just makes it

Multi-POS ready: add new provider blocks in push_order_to_pos().
"""
import logging
from typing import Any, Dict, List, Optional

from app.integrations.square.adapter import SquareAdapter

logger  = logging.getLogger(__name__)
_square = SquareAdapter()


# ── public entry point ────────────────────────────────────────────────────────

async def push_order_to_pos(
    *,
    db,
    shop_id: str,
    loyalcup_order_id: str,
    items: List[Dict[str, Any]],
    customer_note: Optional[str] = None,
) -> Optional[str]:
    """
    Route to the right POS provider.
    Returns external POS order ID or None.
    Non-fatal — never blocks order creation.
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
            logger.info(f"[POS] shop {shop_id} has no active POS connection — skipping push")
            return None

        conn     = conn_resp.data[0]
        provider = conn.get("provider")

        if provider == "square":
            return await _push_to_square(
                db=db,
                conn=conn,
                shop_id=shop_id,
                loyalcup_order_id=loyalcup_order_id,
                items=items,
                customer_note=customer_note,
            )

        # Future: elif provider == "clover": ...
        logger.warning(f"[POS] provider '{provider}' not yet supported for order push")
        return None

    except Exception as e:
        logger.exception(f"[POS] Unexpected error routing order {loyalcup_order_id}: {e}")
        return None


async def process_payment(
    *,
    db,
    shop_id: str,
    loyalcup_order_id: str,
    items: List[Dict[str, Any]],
    payment_nonce: str,           # from Square In-App Payments SDK
    loyalty_discount_cents: int = 0,
    customer_note: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Full atomic flow:
      1. Create OPEN Square order → get Square-calculated tax + total
      2. Apply loyalty discount if any
      3. Charge card via Square Payments API
      4. Return { square_order_id, square_payment_id, charged_cents, tax_cents }

    Raises on any failure — caller should catch and surface to user.
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
        raise ValueError(f"Shop {shop_id} has no active POS connection.")

    conn     = conn_resp.data[0]
    provider = conn.get("provider")

    if provider == "square":
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

    raise ValueError(f"Payment not yet supported for provider '{provider}'")


# ── Square implementation ─────────────────────────────────────────────────────

async def _build_square_line_items(
    db,
    items: List[Dict[str, Any]],
    loyalcup_order_id: str,
) -> List[Dict[str, Any]]:
    """Translate LoyalCup order items into Square line_items."""
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
            logger.warning(f"[Square] menu_item {item['menu_item_id']} not found — skipping")
            continue

        unit_price_cents = int(round(
            float(item.get("unit_price") or item.get("base_price", 0)) * 100
        ))

        line_item: Dict[str, Any] = {
            "quantity": str(item.get("quantity", 1)),
            "base_price_money": {
                "amount": unit_price_cents,
                "currency": "USD",
            },
        }

        pos_id     = menu_row.get("pos_id")
        pos_source = (menu_row.get("pos_source") or "").lower()

        if pos_id and pos_source == "square":
            line_item["catalog_object_id"] = pos_id
        else:
            # LoyalCup-native item — free-text, still shows on POS
            line_item["name"] = menu_row.get("name", "Item")

        # Modifiers
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
    """Push an order-only (no payment) to Square. Used when shop has POS but no payment nonce."""
    try:
        access_token = conn["access_token"]
        location_id  = conn["location_id"]

        line_items = await _build_square_line_items(db, items, loyalcup_order_id)
        if not line_items:
            return None

        order_payload: Dict[str, Any] = {
            "line_items": line_items,
            "reference_id": loyalcup_order_id,
            "state": "OPEN",
        }
        if customer_note:
            order_payload["customer_note"] = customer_note

        result         = await _square.create_order(
            access_token=access_token,
            location_id=location_id,
            order_payload=order_payload,
        )
        square_order_id = result.get("order", {}).get("id")
        logger.info(f"[Square] Order-only push: square_order_id={square_order_id}")
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
    """
    1. Create Square order (gets real tax from Square)
    2. Compute final charge = total_money - loyalty_discount
    3. Charge card
    """
    access_token = conn["access_token"]
    location_id  = conn["location_id"]

    # Step 1 — build line items
    line_items = await _build_square_line_items(db, items, loyalcup_order_id)
    if not line_items:
        raise ValueError("No valid line items to process payment for")

    order_payload: Dict[str, Any] = {
        "line_items": line_items,
        "reference_id": loyalcup_order_id,
        "state": "OPEN",
    }
    if customer_note:
        order_payload["customer_note"] = customer_note

    # Step 2 — create order, Square returns calculated tax
    logger.info(f"[Square] Creating order for payment, loyalcup_order={loyalcup_order_id}")
    order_result   = await _square.create_order(
        access_token=access_token,
        location_id=location_id,
        order_payload=order_payload,
    )
    square_order   = order_result.get("order", {})
    square_order_id = square_order.get("id")

    # Square returns total_money as the final amount including tax
    total_money    = square_order.get("total_money", {})
    total_cents    = total_money.get("amount", 0)
    currency       = total_money.get("currency", "USD")
    tax_money      = square_order.get("total_tax_money", {})
    tax_cents      = tax_money.get("amount", 0)

    # Step 3 — apply loyalty discount
    charge_cents = max(0, total_cents - loyalty_discount_cents)

    logger.info(
        f"[Square] Order {square_order_id}: subtotal+tax={total_cents}¢  "
        f"loyalty_discount={loyalty_discount_cents}¢  charge={charge_cents}¢"
    )

    # Step 4 — charge the card
    payment_result  = await _square.charge_payment(
        access_token=access_token,
        location_id=location_id,
        source_id=payment_nonce,
        amount_cents=charge_cents,
        currency=currency,
        order_id=square_order_id,
        reference_id=loyalcup_order_id,
        customer_note=customer_note,
    )

    payment         = payment_result.get("payment", {})
    square_payment_id = payment.get("id")
    payment_status  = payment.get("status")

    if payment_status not in ("COMPLETED", "APPROVED"):
        raise RuntimeError(
            f"Payment not completed. Status: {payment_status}. "
            f"Details: {payment_result}"
        )

    logger.info(
        f"[Square] Payment SUCCESS: payment_id={square_payment_id}  "
        f"status={payment_status}  charged={charge_cents}¢"
    )

    return {
        "square_order_id":   square_order_id,
        "square_payment_id": square_payment_id,
        "charged_cents":     charge_cents,
        "tax_cents":         tax_cents,
        "total_cents":       total_cents,
        "currency":          currency,
    }