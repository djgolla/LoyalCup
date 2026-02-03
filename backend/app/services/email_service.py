"""
Email service for sending transactional emails.
Uses SendGrid for reliable email delivery.
"""
from typing import List, Optional
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """
    Service for sending emails via SendGrid.
    """
    
    def __init__(self):
        """Initialize the email service."""
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
        """
        Send an email.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text content (optional)
            
        Returns:
            True if email sent successfully, False otherwise
        """
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
                logger.info(f"Email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"Failed to send email to {to_email}: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {e}")
            return False
    
    async def send_order_confirmation(
        self,
        to_email: str,
        order_id: str,
        shop_name: str,
        items: List[dict],
        total: float
    ) -> bool:
        """
        Send order confirmation email.
        
        Args:
            to_email: Customer email
            order_id: Order ID
            shop_name: Shop name
            items: List of order items
            total: Order total
            
        Returns:
            True if email sent successfully
        """
        subject = f"Order Confirmation - {shop_name}"
        
        items_html = "".join([
            f"<li>{item['name']} x {item['quantity']} - ${item['price']:.2f}</li>"
            for item in items
        ])
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #6B46C1;">Order Confirmation</h1>
                <p>Thank you for your order at {shop_name}!</p>
                <p><strong>Order ID:</strong> {order_id}</p>
                <h3>Order Details:</h3>
                <ul>{items_html}</ul>
                <p><strong>Total:</strong> ${total:.2f}</p>
                <p>We'll notify you when your order is ready for pickup.</p>
                <p style="color: #666; font-size: 12px; margin-top: 40px;">
                    This is an automated email from LoyalCup. Please do not reply.
                </p>
            </body>
        </html>
        """
        
        return await self.send_email(to_email, subject, html_content)
    
    async def send_order_status_update(
        self,
        to_email: str,
        order_id: str,
        shop_name: str,
        status: str
    ) -> bool:
        """
        Send order status update email.
        
        Args:
            to_email: Customer email
            order_id: Order ID
            shop_name: Shop name
            status: New order status
            
        Returns:
            True if email sent successfully
        """
        status_messages = {
            "accepted": "Your order has been accepted and is being prepared.",
            "preparing": "Your order is being prepared.",
            "ready": "Your order is ready for pickup!",
            "completed": "Your order has been completed. Thank you!",
            "cancelled": "Your order has been cancelled."
        }
        
        message = status_messages.get(status, f"Your order status: {status}")
        subject = f"Order Update - {shop_name}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #6B46C1;">Order Status Update</h1>
                <p><strong>Order ID:</strong> {order_id}</p>
                <p><strong>Shop:</strong> {shop_name}</p>
                <p style="font-size: 18px; color: #333;">{message}</p>
                <p style="color: #666; font-size: 12px; margin-top: 40px;">
                    This is an automated email from LoyalCup. Please do not reply.
                </p>
            </body>
        </html>
        """
        
        return await self.send_email(to_email, subject, html_content)
    
    async def send_shop_approval_notification(
        self,
        to_email: str,
        shop_name: str,
        approved: bool
    ) -> bool:
        """
        Send shop approval/rejection notification.
        
        Args:
            to_email: Shop owner email
            shop_name: Shop name
            approved: Whether shop was approved
            
        Returns:
            True if email sent successfully
        """
        if approved:
            subject = f"Congratulations! {shop_name} Approved on LoyalCup"
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #6B46C1;">Congratulations!</h1>
                    <p>Your shop <strong>{shop_name}</strong> has been approved and is now live on LoyalCup!</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Build your menu</li>
                        <li>Set up loyalty rewards</li>
                        <li>Invite workers</li>
                        <li>Start accepting orders</li>
                    </ul>
                    <p><a href="https://loyalcup.com/shop-owner/dashboard" style="background-color: #6B46C1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Dashboard</a></p>
                </body>
            </html>
            """
        else:
            subject = f"Shop Application Update - {shop_name}"
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #6B46C1;">Shop Application Update</h1>
                    <p>Thank you for your interest in joining LoyalCup.</p>
                    <p>Unfortunately, we are unable to approve your shop <strong>{shop_name}</strong> at this time.</p>
                    <p>Please contact us if you have any questions.</p>
                </body>
            </html>
            """
        
        return await self.send_email(to_email, subject, html_content)


# Global email service instance
email_service = EmailService()
