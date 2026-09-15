"""
Transactional email via Resend (PRD Section 7). Talks to Resend's HTTP API
directly (no extra SDK dependency).

When RESEND_API_KEY is unset (local dev / CI), emails are logged instead of
sent — see settings.NOTIFICATIONS_LOG_ONLY.
"""
import logging

import requests
from django.conf import settings

from common.timezones import format_display

logger = logging.getLogger("api.notifications")

RESEND_ENDPOINT = "https://api.resend.com/emails"


def send_email(to_email, subject, html):
    if settings.NOTIFICATIONS_LOG_ONLY:
        logger.info("[email:log-only] to=%s subject=%r\n%s", to_email, subject, html)
        return

    try:
        resp = requests.post(
            RESEND_ENDPOINT,
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            json={
                "from": settings.NOTIFICATIONS_FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": html,
            },
            timeout=10,
        )
        if resp.status_code >= 400:
            logger.error("Resend send failed (%s): %s", resp.status_code, resp.text)
    except requests.RequestException:
        logger.exception("Resend send raised an exception")


def _manage_link(booking):
    return f"{settings.PUBLIC_SITE_URL}/manage/{booking.manage_token}"


def _wrap(title, body_html, cta_label=None, cta_url=None):
    cta = f'<p><a href="{cta_url}">{cta_label}</a></p>' if cta_url else ""
    return f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>{title}</h2>
      {body_html}
      {cta}
      <p style="color:#888; font-size: 12px;">BraidsByChi</p>
    </div>
    """


def send_booking_request_received(booking):
    body = f"""
    <p>Hi {booking.client.name}, thanks for your request!</p>
    <p>Requested time: <strong>{format_display(booking.requested_start_time)}</strong> –
       {format_display(booking.service_end_time)}</p>
    <p>Your request has been sent to the stylist and is <strong>pending</strong> review.
       You'll get another email as soon as it's approved or declined.</p>
    <p>You can view, cancel, or reschedule this request any time using the link below.</p>
    """
    html = _wrap("Booking request received", body, "Manage my booking", _manage_link(booking))
    send_email(booking.client.email, "We received your booking request", html)


def send_booking_approved(booking):
    body = f"""
    <p>Hi {booking.client.name}, your appointment is confirmed!</p>
    <p><strong>{format_display(booking.requested_start_time)} – {format_display(booking.service_end_time)}</strong></p>
    <p>Amount charged today: ${booking.amount_due_today}</p>
    """
    html = _wrap("Your appointment is confirmed", body, "Manage my booking", _manage_link(booking))
    send_email(booking.client.email, "Your appointment is confirmed", html)


def send_booking_declined(booking):
    reason_html = f"<p>Reason: {booking.decline_reason}</p>" if booking.decline_reason else ""
    body = f"""
    <p>Hi {booking.client.name}, unfortunately your request for
       {format_display(booking.requested_start_time)} could not be approved.</p>
    {reason_html}
    <p>No charge has been made. Feel free to submit a new request for another time.</p>
    """
    html = _wrap("Your booking request was declined", body, "Book another time", settings.PUBLIC_SITE_URL)
    send_email(booking.client.email, "About your booking request", html)


def send_strike_warning(booking, strike_number):
    body = f"""
    <p>Hi {booking.client.name}, we marked your {format_display(booking.requested_start_time)}
       appointment as a missed appointment / late cancellation.</p>
    <p>This is strike #{strike_number} on your account. Any deposit paid has been forfeited.</p>
    """
    if strike_number >= settings.STRIKE_HIGH_RISK_COUNT:
        body += "<p><strong>Future bookings will require full payment upfront before they can be submitted.</strong></p>"
    html = _wrap("Missed appointment notice", body)
    send_email(booking.client.email, "Missed appointment notice", html)


def send_reschedule_confirmation(booking):
    body = f"""
    <p>Hi {booking.client.name}, your appointment has been rescheduled to:</p>
    <p><strong>{format_display(booking.requested_start_time)} – {format_display(booking.service_end_time)}</strong></p>
    """
    html = _wrap("Your appointment was rescheduled", body, "Manage my booking", _manage_link(booking))
    send_email(booking.client.email, "Your appointment was rescheduled", html)


def send_cancellation_confirmation(booking):
    body = f"""
    <p>Hi {booking.client.name}, your appointment on
       {format_display(booking.requested_start_time)} has been cancelled as requested.</p>
    """
    html = _wrap("Your appointment was cancelled", body)
    send_email(booking.client.email, "Your appointment was cancelled", html)


def send_expiry_notice(booking):
    body = f"""
    <p>Hi {booking.client.name}, your request for {format_display(booking.requested_start_time)}
       wasn't reviewed in time and has expired. No charge was made.</p>
    <p>Please feel free to submit a new request for a time that works for you.</p>
    """
    html = _wrap("Your booking request expired", body, "Book again", settings.PUBLIC_SITE_URL)
    send_email(booking.client.email, "Your booking request expired", html)


def send_blocked_day_generic_notice(booking):
    """Immediate, generic heads-up the moment a day is blocked (PRD Section 5, step 1)."""
    body = """
    <p>There has been a scheduling change that affects your upcoming appointment.
       The stylist will follow up with you shortly to sort out the details.</p>
    """
    html = _wrap("A scheduling change affects your appointment", body)
    send_email(booking.client.email, "A scheduling change affects your appointment", html)


def send_blocked_day_resolution_cancelled(booking):
    """Specific resolution email once the stylist processes the affected booking
    as a refund/cancellation (deposit-free, doesn't count against limits)."""
    body = f"""
    <p>Hi {booking.client.name}, we're sorry — your appointment on
       {format_display(booking.requested_start_time)} needed to be cancelled due to a scheduling change
       on the stylist's side.</p>
    <p>Any amount paid has been fully refunded.</p>
    """
    html = _wrap("Your appointment was cancelled (refunded)", body, "Book another time", settings.PUBLIC_SITE_URL)
    send_email(booking.client.email, "Your appointment was cancelled — refunded", html)


def send_blocked_day_resolution_reschedule(booking):
    """Specific resolution email offering a deposit-free reschedule link that
    doesn't count against the client's normal reschedule limit."""
    body = f"""
    <p>Hi {booking.client.name}, due to a scheduling change on the stylist's side, your appointment
       needs to move. Use the link below to pick a new time — no extra deposit, and this
       won't count against your usual one-time reschedule limit.</p>
    """
    html = _wrap("Please pick a new time", body, "Choose a new time", _manage_link(booking))
    send_email(booking.client.email, "Please pick a new time for your appointment", html)
