from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from app.services.email_service import email_service
from app.utils.logging import get_logger
import asyncio
from concurrent.futures import ThreadPoolExecutor
import html

router = APIRouter(
    prefix="/api/v1/contact",
    tags=["contact"],
)

logger = get_logger(__name__)
executor = ThreadPoolExecutor(max_workers=5)


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=160)
    message: str = Field(..., min_length=1, max_length=5000)


class AccountDeletionRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    account_type: str = Field(default="customer", max_length=40)
    message: str = Field(default="", max_length=5000)


def send_email_blocking(to: str, subject: str, html_body: str, reply_to: str):
    return email_service.send_email(
        to=to,
        subject=subject,
        html=html_body,
        reply_to=reply_to,
    )


@router.post("/send")
async def send_contact_email(data: ContactRequest):
    """Send contact form email to support@loyalcupapp.com"""
    logger.info(f"[Contact] Received request from {data.email}")

    safe_name = html.escape(data.name)
    safe_email = html.escape(str(data.email))
    safe_subject = html.escape(data.subject)
    safe_message = html.escape(data.message).replace("\n", "<br>")

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            executor,
            send_email_blocking,
            "support@loyalcupapp.com",
            f"Contact Form: {data.subject[:120]}",
            f"""
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> {safe_name} ({safe_email})</p>
            <p><strong>Subject:</strong> {safe_subject}</p>
            <p><strong>Message:</strong></p>
            <p>{safe_message}</p>
            """,
            str(data.email),
        )

        logger.info(f"[Contact] Email sent successfully from {data.email}")
        return {"message": "Email sent successfully"}

    except Exception as e:
        logger.error(f"[Contact] Failed to send email: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email",
        )


@router.post("/account-deletion")
async def send_account_deletion_request(data: AccountDeletionRequest):
    """Send account deletion request to support@loyalcupapp.com"""
    logger.info(f"[AccountDeletion] Received deletion request from {data.email}")

    safe_name = html.escape(data.name)
    safe_email = html.escape(str(data.email))
    safe_account_type = html.escape(data.account_type or "customer")
    safe_message = html.escape(data.message or "").replace("\n", "<br>")

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            executor,
            send_email_blocking,
            "support@loyalcupapp.com",
            f"Account Deletion Request: {safe_email}",
            f"""
            <h2>Account Deletion Request</h2>
            <p><strong>Company:</strong> LoyalCup LLC</p>
            <p><strong>Name:</strong> {safe_name}</p>
            <p><strong>Email:</strong> {safe_email}</p>
            <p><strong>Account Type:</strong> {safe_account_type}</p>

            <h3>Requested Action</h3>
            <p>The user is requesting deletion of their LoyalCup account and associated personal data, subject to any records LoyalCup LLC must retain for legal, payment, tax/accounting, dispute, fraud prevention, security, or compliance reasons.</p>

            <h3>Optional Message</h3>
            <p>{safe_message if safe_message else "No additional message provided."}</p>

            <hr />
            <p><strong>Suggested next steps:</strong></p>
            <ol>
              <li>Verify this request came from the email tied to the LoyalCup account.</li>
              <li>Locate matching Supabase profile/account records.</li>
              <li>Delete or anonymize eligible account data.</li>
              <li>Retain only records legally or operationally required.</li>
              <li>Reply to the user when complete.</li>
            </ol>
            """,
            str(data.email),
        )

        logger.info(f"[AccountDeletion] Email sent successfully from {data.email}")
        return {
            "message": "Account deletion request received",
            "timeline": "Eligible requests are reviewed and processed within 30 days",
        }

    except Exception as e:
        logger.error(f"[AccountDeletion] Failed to send deletion request: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit account deletion request",
        )