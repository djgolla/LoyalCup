import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from app.utils.logging import get_logger
import socket

logger = get_logger(__name__)


class EmailService:
    """Email service for sending transactional emails via Google SMTP"""

    def send_email(self, to: str, subject: str, html: str, reply_to: str = None):
        """Send email via Google SMTP (synchronous)"""
        try:
            if not settings.google_app_password:
                logger.error("GOOGLE_APP_PASSWORD not configured")
                raise ValueError("Email service not configured - missing GOOGLE_APP_PASSWORD")
            
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = "support@loyalcupapp.com"
            msg["To"] = to
            if reply_to:
                msg["Reply-To"] = reply_to

            msg.attach(MIMEText(html, "html"))

            logger.info(f"Connecting to smtp-relay.gmail.com:587")
            with smtplib.SMTP("smtp-relay.gmail.com", 587, timeout=10) as server:
                logger.info("Connected, starting TLS")
                server.starttls()
                logger.info("TLS started, logging in")
                server.login("support@loyalcupapp.com", settings.google_app_password)
                logger.info("Login successful, sending message")
                server.send_message(msg)

            logger.info(f"Email sent to {to}")
            return True
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Auth failed: {str(e)}")
            raise
        except socket.timeout as e:
            logger.error(f"SMTP timeout (connection took >10s): {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Email error: {str(e)}")
            raise

    def send_order_confirmation_rich(self, to_email: str, order_id: str, shop_name: str, 
                                          items: list, subtotal: float, tax: float, total: float, 
                                          customer_note: str = None):
        """Send order confirmation email"""
        try:
            items_html = "".join([
                f"<tr><td>{item.get('name', 'Item')}</td><td>x{item.get('quantity', 1)}</td><td>${item.get('price', 0):.2f}</td></tr>"
                for item in items
            ])
            
            note_html = f"<p><strong>Special Instructions:</strong> {customer_note}</p>" if customer_note else ""

            html = f"""
            <h2>Order Confirmation</h2>
            <p>Thank you for your order at <strong>{shop_name}</strong>!</p>
            <p><strong>Order ID:</strong> {order_id}</p>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr style="border-bottom: 1px solid #ccc;">
                    <th style="text-align: left; padding: 8px;">Item</th>
                    <th style="text-align: left; padding: 8px;">Qty</th>
                    <th style="text-align: right; padding: 8px;">Price</th>
                </tr>
                {items_html}
            </table>
            <p><strong>Subtotal:</strong> ${subtotal:.2f}</p>
            <p><strong>Tax:</strong> ${tax:.2f}</p>
            <p><strong>Total:</strong> ${total:.2f}</p>
            {note_html}
            <p>Your order will be ready soon!</p>
            """

            self.send_email(
                to=to_email,
                subject=f"Order Confirmation - {order_id}",
                html=html
            )
        except Exception as e:
            logger.error(f"Failed to send order confirmation: {str(e)}")
            raise


email_service = EmailService()