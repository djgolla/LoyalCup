from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.services.email_service import email_service
from app.utils.logging import get_logger
import asyncio
from concurrent.futures import ThreadPoolExecutor

router = APIRouter(
    prefix="/api/v1/contact",
    tags=["contact"],
)

logger = get_logger(__name__)
executor = ThreadPoolExecutor(max_workers=5)


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


def send_email_blocking(to: str, subject: str, html: str, reply_to: str):
    """Wrapper to send email with keyword args"""
    return email_service.send_email(
        to=to,
        subject=subject,
        html=html,
        reply_to=reply_to
    )


@router.post("/send")
async def send_contact_email(data: ContactRequest):
    """Send contact form email to support@loyalcupapp.com"""
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            executor,
            send_email_blocking,
            "support@loyalcupapp.com",
            f"Contact Form: {data.subject}",
            f"""
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> {data.name} ({data.email})</p>
            <p><strong>Subject:</strong> {data.subject}</p>
            <p><strong>Message:</strong></p>
            <p>{data.message.replace(chr(10), '<br>')}</p>
            """,
            data.email
        )
        logger.info(f"Contact email sent from {data.email}")
        return {"message": "Email sent successfully"}
    except Exception as e:
        logger.error(f"Failed to send contact email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email"
        )