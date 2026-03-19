"""
Email service for sending transactional emails via SendGrid.
"""
from typing import List, Optional
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from app.config import settings

logger = logging.getLogger(__name__)

STATUS_COPY = {
    "accepted": {
        "emoji": "✅",
        "headline": "Your order is confirmed!",
        "body": "The barista has your order and is getting started. Hang tight!",
        "color": "#16a34a",
    },
    "preparing": {
        "emoji": "☕",
        "headline": "Your order is being made",
        "body": "Brewing in progress — your order is being carefully prepared.",
        "color": "#d97706",
    },
    "ready": {
        "emoji": "🎉",
        "headline": "Your order is ready!",
        "body": "Head to the counter — your order is hot and waiting for you!",
        "color": "#059669",
    },
    "completed": {
        "emoji": "⭐",
        "headline": "Order complete — enjoy!",
        "body": "Thanks for using LoyalCup. Don't forget to leave a review!",
        "color": "#7c3aed",
    },
    "cancelled": {
        "emoji": "❌",
        "headline": "Order cancelled",
        "body": "Your order has been cancelled. If this was unexpected, please contact the shop.",
        "color": "#dc2626",
    },
}


def _base_template(inner_html: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>LoyalCup</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#d97706,#ea580c);padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">☕ LoyalCup</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Your coffee, your rewards</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            {inner_html}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated message from LoyalCup · Please do not reply</p>
            <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">© 2026 LoyalCup · All rights reserved</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def _items_html(items: List[dict]) -> str:
    if not items:
        return ""
    rows = ""
    for item in items:
        name = item.get("menu_items", {}).get("name") if isinstance(item.get("menu_items"), dict) else item.get("name", "Item")
        qty = item.get("quantity", 1)
        price = float(item.get("total_price") or item.get("unit_price") or 0)
        customizations = item.get("customizations", [])
        mods = ", ".join([c.get("name", "") for c in customizations if c.get("name")]) if customizations else ""
        rows += f"""
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">
            <strong>{name}</strong> × {qty}
            {"<br/><span style='font-size:12px;color:#9ca3af;'>" + mods + "</span>" if mods else ""}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-size:14px;font-weight:600;color:#059669;">${price:.2f}</td>
        </tr>"""
    return f"<table width='100%' cellpadding='0' cellspacing='0' style='margin:16px 0;'>{rows}</table>"


class EmailService:
    def __init__(self):
        self.client = None
        if settings.sendgrid_api_key:
            try:
                self.client = SendGridAPIClient(settings.sendgrid_api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize SendGrid client: {e}")
        else:
            logger.warning("SendGrid API key not configured. Email sending disabled.")

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        if not self.client:
            logger.warning(f"Cannot send email to {to_email}: SendGrid not configured")
            return False
        try:
            message = Mail(
                from_email=Email(settings.sendgrid_from_email),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            if text_content:
                message.content = [
                    Content("text/plain", text_content),
                    Content("text/html", html_content)
                ]
            response = self.client.send(message)
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent to {to_email} ({response.status_code})")
                return True
            else:
                logger.error(f"Failed to send email to {to_email}: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {e}")
            return False

    async def send_order_confirmation_rich(
        self,
        to_email: str,
        order_id: str,
        shop_name: str,
        items: List[dict],
        subtotal: float,
        tax: float,
        total: float,
        customer_note: Optional[str] = None,
    ) -> bool:
        """Branded order confirmation receipt with itemized breakdown."""
        short_id = order_id[:8].upper()
        items_section = _items_html(items)
        note_section = f"""
          <div style="margin:16px 0;padding:12px 16px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:4px;">
            <p style="margin:0;font-size:13px;color:#92400e;"><strong>Note:</strong> {customer_note}</p>
          </div>""" if customer_note else ""

        inner = f"""
          <h2 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#111827;">Order Confirmed! 🎉</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Your order at <strong>{shop_name}</strong> has been placed.</p>

          <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
            <p style="margin:0;font-size:13px;color:#6b7280;">Order ID</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:#111827;font-family:monospace;">#{short_id}</p>
          </div>

          {note_section}

          <h3 style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Order Summary</h3>
          {items_section}

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
            <tr>
              <td style="font-size:13px;color:#6b7280;padding:4px 0;">Subtotal</td>
              <td style="text-align:right;font-size:13px;color:#374151;">${subtotal:.2f}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#6b7280;padding:4px 0;">Tax</td>
              <td style="text-align:right;font-size:13px;color:#374151;">${tax:.2f}</td>
            </tr>
            <tr>
              <td style="font-size:15px;font-weight:700;color:#111827;padding:8px 0 4px;border-top:2px solid #e5e7eb;">Total</td>
              <td style="text-align:right;font-size:15px;font-weight:700;color:#059669;padding:8px 0 4px;border-top:2px solid #e5e7eb;">${total:.2f}</td>
            </tr>
          </table>

          <div style="margin:24px 0 0;padding:16px;background:#ecfdf5;border-radius:12px;text-align:center;">
            <p style="margin:0;font-size:14px;color:#065f46;">☕ We'll send you an email the moment your order is ready for pickup!</p>
          </div>
        """

        html = _base_template(inner)
        return await self.send_email(
            to_email=to_email,
            subject=f"☕ Order Confirmed — {shop_name} (#{short_id})",
            html_content=html,
        )

    async def send_order_status_update_rich(
        self,
        to_email: str,
        order_id: str,
        shop_name: str,
        status: str,
        items: List[dict],
        total: float,
    ) -> bool:
        """Branded status update email — especially ✨ the 'ready' one."""
        copy = STATUS_COPY.get(status, {
            "emoji": "📋",
            "headline": f"Order update: {status}",
            "body": f"Your order status has been updated to {status}.",
            "color": "#374151",
        })
        short_id = order_id[:8].upper()
        items_section = _items_html(items)

        inner = f"""
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:52px;line-height:1;">{copy['emoji']}</div>
            <h2 style="margin:12px 0 4px;font-size:22px;font-weight:800;color:#111827;">{copy['headline']}</h2>
            <p style="margin:0;font-size:14px;color:#6b7280;">{copy['body']}</p>
          </div>

          <div style="background:#f9fafb;border-radius:12px;padding:14px 20px;margin-bottom:20px;display:flex;justify-content:space-between;">
            <div>
              <p style="margin:0;font-size:12px;color:#9ca3af;">Order</p>
              <p style="margin:2px 0 0;font-size:16px;font-weight:800;color:#111827;font-family:monospace;">#{short_id}</p>
            </div>
            <div style="text-align:right;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Shop</p>
              <p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#374151;">{shop_name}</p>
            </div>
          </div>

          <h3 style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Your Order</h3>
          {items_section}

          <div style="text-align:right;margin-top:4px;font-size:15px;font-weight:700;color:#059669;">Total: ${total:.2f}</div>

          {"<div style='margin:24px 0 0;padding:16px;background:#ecfdf5;border-radius:12px;text-align:center;'><p style='margin:0;font-size:15px;font-weight:700;color:#065f46;'>🏃 Head over — your order is at the counter!</p></div>" if status == "ready" else ""}
        """

        html = _base_template(inner)
        subject_map = {
            "accepted": f"✅ Order accepted at {shop_name}",
            "ready": f"🎉 Your order is READY — {shop_name}",
            "cancelled": f"❌ Order cancelled — {shop_name}",
        }
        subject = subject_map.get(status, f"Order update — {shop_name}")
        return await self.send_email(to_email=to_email, subject=subject, html_content=html)

    # ── Legacy methods kept for backwards compatibility ──────────────────────

    async def send_order_confirmation(
        self, to_email: str, order_id: str, shop_name: str, items: List[dict], total: float
    ) -> bool:
        subject = f"Order Confirmation - {shop_name}"
        items_html = "".join([
            f"<li>{item.get('name','Item')} x {item.get('quantity',1)} - ${float(item.get('price',0)):.2f}</li>"
            for item in items
        ])
        html_content = f"""<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h1 style="color:#d97706;">Order Confirmation</h1>
            <p>Thank you for your order at {shop_name}!</p>
            <p><strong>Order ID:</strong> {order_id}</p>
            <h3>Order Details:</h3><ul>{items_html}</ul>
            <p><strong>Total:</strong> ${total:.2f}</p>
            <p>We'll notify you when your order is ready for pickup.</p>
        </body></html>"""
        return await self.send_email(to_email, subject, html_content)

    async def send_order_status_update(
        self, to_email: str, order_id: str, shop_name: str, status: str
    ) -> bool:
        copy = STATUS_COPY.get(status, {"body": f"Your order status: {status}", "color": "#374151"})
        subject = f"Order Update - {shop_name}"
        html_content = f"""<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h1 style="color:#d97706;">Order Status Update</h1>
            <p><strong>Order ID:</strong> {order_id}</p>
            <p><strong>Shop:</strong> {shop_name}</p>
            <p style="font-size:18px;color:{copy['color']};">{copy['body']}</p>
        </body></html>"""
        return await self.send_email(to_email, subject, html_content)

    async def send_shop_approval_notification(
        self, to_email: str, shop_name: str, approved: bool
    ) -> bool:
        if approved:
            subject = f"Congratulations! {shop_name} Approved on LoyalCup"
            html_content = f"""<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <h1 style="color:#d97706;">Congratulations!</h1>
                <p>Your shop <strong>{shop_name}</strong> has been approved and is now live on LoyalCup!</p>
                <ul><li>Build your menu</li><li>Set up loyalty rewards</li><li>Connect Square POS</li><li>Start accepting orders</li></ul>
                <p><a href="https://loyalcupapp.com/shop-owner/dashboard" style="background:#d97706;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;">Go to Dashboard</a></p>
            </body></html>"""
        else:
            subject = f"Shop Application Update - {shop_name}"
            html_content = f"""<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <h1 style="color:#d97706;">Shop Application Update</h1>
                <p>Thank you for your interest in joining LoyalCup.</p>
                <p>Unfortunately, we are unable to approve your shop <strong>{shop_name}</strong> at this time.</p>
                <p>Please contact us if you have any questions.</p>
            </body></html>"""
        return await self.send_email(to_email, subject, html_content)


# Global email service instance
email_service = EmailService()