import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)


async def send_email(to: str, subject: str, html: str, reply_to: str = None):
    """Send email via Google SMTP"""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = "support@loyalcupapp.com"
        msg["To"] = to
        if reply_to:
            msg["Reply-To"] = reply_to

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login("support@loyalcupapp.com", settings.google_app_password)
            server.send_message(msg)

        logger.info(f"Email sent to {to}")
        return True
    except Exception as e:
        logger.error(f"Email error: {str(e)}")
        raise