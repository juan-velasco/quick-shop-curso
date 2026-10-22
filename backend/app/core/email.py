import logging
import smtplib
from collections.abc import Callable
from email.message import EmailMessage

from app.core.config import get_settings

logger = logging.getLogger(__name__)

Mailer = Callable[[str, str, str], None]


def build_message(to: str, subject: str, body: str, sender: str) -> EmailMessage:
    message = EmailMessage()
    message["From"] = sender
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    return message


def send_email(to: str, subject: str, body: str) -> None:
    settings = get_settings()
    message = build_message(to, subject, body, settings.smtp_from)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            if settings.smtp_starttls:
                smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException):
        logger.exception("No se pudo enviar el email a %s", to)


def get_mailer() -> Mailer:
    return send_email
