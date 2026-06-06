import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
from app.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)


async def send_email(to: str, subject: str, html: str, reply_to: str = None):
    """Send email via SendGrid"""
    if not settings.sendgrid_api_key:
        logger.error("SendGrid API key not configured")
        raise ValueError("Email service not configured")
    
    try:
        sg = sendgrid.SendGridAPIClient(settings.sendgrid_api_key)
        
        message = Mail(
            from_email=Email("forgotpassword@loyalcupapp.com", "LoyalCup"),
            to_emails=To(to),
            subject=subject,
            html_content=Content("text/html", html)
        )
        
        if reply_to:
            message.reply_to = Email(reply_to)
        
        response = sg.send(message)
        logger.info(f"Email sent to {to}: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"SendGrid error: {str(e)}")
        raise