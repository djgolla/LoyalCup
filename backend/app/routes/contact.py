from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.services.email_service import email_service
from app.utils.logging import get_logger

router = APIRouter(
    prefix="/api/v1/contact",
    tags=["contact"],
)

logger = get_logger(__name__)


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


@router.post("/send")
async def send_contact_email(data: ContactRequest):
    """Send contact form email to support@loyalcupapp.com"""
    try:
        email_service.send_email(
            to="support@loyalcupapp.com",
            subject=f"Contact Form: {data.subject}",
            html=f"""
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> {data.name} ({data.email})</p>
            <p><strong>Subject:</strong> {data.subject}</p>
            <p><strong>Message:</strong></p>
            <p>{data.message.replace(chr(10), '<br>')}</p>
            """,
            reply_to=data.email
        )
        return {"message": "Email sent successfully"}
    except Exception as e:
        logger.error(f"Failed to send contact email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email"
        )