"""
Core booking business logic (deposit math, strike system, approval/decline,
conflict handling). Kept out of views.py so it's independently testable.
"""
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from clients.models import Client
from catalog.models import Service
from common.captcha import verify_captcha
from common.errors import (
    ApiError,
    PolicyNotAcknowledged,
    SlotUnavailable,
    ProofRequired,
    NoteRequired,
    RescheduleLimitReached,
    ActionCutoffPassed,
    CardVerificationFailed,
)
from availability.slots import slot_is_available
from notifications import emails
from payments import stripe_service

from .models import Booking, BookingItem, BookingStatus, ArrivalStatus, PaymentMethod


def resolve_client(name, email, phone):
    """Repeat-client matching uses EITHER phone OR email (PRD 6.2)."""
    existing = Client.find_matching(email, phone).order_by("-strike_count", "-high_risk_flag").first()
    if existing:
        existing.name = name
        existing.email = email
        existing.phone = phone
        existing.save(update_fields=["name", "email", "phone", "updated_at"])
        return existing
    return Client.objects.create(name=name, email=email, phone=phone)


def price_and_risk_preview(service_ids, client=None):
    """
    Shared by the precheck endpoint and booking creation. Implements PRD
    Section 6.1 (threshold-based flat deposit) and Section 8.1 (strike
    escalation to mandatory full payment).
    """
    services = list(Service.objects.filter(id__in=service_ids, is_active=True))
    if len(services) != len(set(service_ids)):
        raise ApiError(code="invalid_service", message="One or more selected services are unavailable.")

    total_price = sum((s.price for s in services), Decimal("0.00"))
    required_duration_minutes = sum(s.duration_minutes for s in services)
    is_multi = len(services) > 1

    threshold = Decimal(settings.DEPOSIT_THRESHOLD_AMOUNT)
    deposit_required = total_price >= threshold
    deposit_amount = (
        Decimal(settings.DEPOSIT_AMOUNT_MULTI_SERVICE if is_multi else settings.DEPOSIT_AMOUNT_SINGLE_SERVICE)
        if deposit_required
        else Decimal("0.00")
    )

    full_payment_required = bool(client and client.high_risk_flag)
    if full_payment_required:
        amount_due_today = total_price
    elif deposit_required:
        amount_due_today = deposit_amount
    else:
        amount_due_today = Decimal("0.00")

    # ST-06: inline warning once a client with exactly 1 existing strike is
    # recognized — before they've reached the high-risk full-payment tier.
    strike_warning = bool(client and client.strike_count == 1 and not client.high_risk_flag)

    return {
        "services": services,
        "total_price": total_price,
        "required_duration_minutes": required_duration_minutes,
        "deposit_amount": deposit_amount,
        "full_payment_required": full_payment_required,
        "amount_due_today": amount_due_today,
        "strike_warning": strike_warning,
    }


def precheck(service_ids, email, phone):
    """Backs an (undocumented-in-contract but necessary) pre-payment lookup
    so the frontend can show the ST-06 inline strike warning and a deposit
    preview before the guest reaches the payment step, without creating a
    booking or requiring a CAPTCHA."""
    client = Client.find_matching(email, phone).order_by("-strike_count", "-high_risk_flag").first() if (
        email or phone
    ) else None
    result = price_and_risk_preview(service_ids, client)
    return {
        "total_price": result["total_price"],
        "deposit_amount": result["deposit_amount"],
        "full_payment_required": result["full_payment_required"],
        "amount_due_today": result["amount_due_today"],
        "strike_warning": result["strike_warning"],
    }


@transaction.atomic
def create_booking(data, remote_ip=None):
    verify_captcha(data.get("captcha_token"), remote_ip)

    if not data.get("policy_acknowledged"):
        raise PolicyNotAcknowledged()

    client_data = data["client"]
    client = resolve_client(client_data["name"], client_data["email"], client_data["phone"])

    pricing = price_and_risk_preview(data["service_ids"], client)

    payment_method = data["payment_method"]
    if payment_method == PaymentMethod.ONLINE and not data.get("stripe_setup_intent_id"):
        raise CardVerificationFailed()

    # Offline high-risk bookings still require the full amount to be
    # confirmed received before approval (PRD 8.1) — same proof-required
    # gate as the normal offline path (see approve_booking), just for the
    # full amount instead of a deposit. No extra check needed here.

    start_time = data["requested_start_time"]
    if not slot_is_available(start_time, pricing["required_duration_minutes"]):
        raise SlotUnavailable()

    service_end_time = start_time + timedelta(minutes=pricing["required_duration_minutes"])
    calendar_blocked_until = service_end_time + timedelta(minutes=settings.BUFFER_MINUTES)

    booking = Booking.objects.create(
        client=client,
        requested_start_time=start_time,
        service_end_time=service_end_time,
        calendar_blocked_until=calendar_blocked_until,
        status=BookingStatus.PENDING,
        payment_method=payment_method,
        total_price=pricing["total_price"],
        deposit_amount=pricing["deposit_amount"],
        amount_due_today=pricing["amount_due_today"],
        full_payment_required=pricing["full_payment_required"],
        policy_acknowledged=True,
        stripe_setup_intent_id=data.get("stripe_setup_intent_id", ""),
    )

    BookingItem.objects.bulk_create(
        [
            BookingItem(
                booking=booking,
                service=s,
                name_snapshot=s.name,
                price_snapshot=s.price,
                duration_snapshot=s.duration_minutes,
            )
            for s in pricing["services"]
        ]
    )

    booking._strike_warning = pricing["strike_warning"]
    emails.send_booking_request_received(booking)
    return booking


def _auto_decline_conflicts(approved_booking):
    """Workflow 6: approving one of several overlapping pending requests
    auto-declines the others, with a notification."""
    conflicting = Booking.objects.filter(
        status=BookingStatus.PENDING,
        requested_start_time__lt=approved_booking.calendar_blocked_until,
        calendar_blocked_until__gt=approved_booking.requested_start_time,
    ).exclude(id=approved_booking.id)

    for booking in conflicting:
        booking.status = BookingStatus.DECLINED
        booking.decline_reason = "This time slot was booked by another client."
        booking.save(update_fields=["status", "decline_reason", "updated_at"])
        emails.send_booking_declined(booking)


@transaction.atomic
def approve_booking(booking, proof_url=None, proof_note=None):
    if booking.status != BookingStatus.PENDING:
        raise ApiError(code="invalid_state", message="Only pending bookings can be approved.")

    if booking.payment_method == PaymentMethod.OFFLINE:
        if not proof_url:
            raise ProofRequired()
        booking.proof_url = proof_url
        booking.proof_note = proof_note or ""
    else:
        if booking.amount_due_today > 0:
            payment_intent_id = stripe_service.capture_amount(booking.stripe_setup_intent_id, booking.amount_due_today)
            booking.stripe_payment_intent_id = payment_intent_id

    booking.status = BookingStatus.APPROVED
    booking.save()

    _auto_decline_conflicts(booking)
    emails.send_booking_approved(booking)
    return booking


@transaction.atomic
def decline_booking(booking, reason=""):
    if booking.status != BookingStatus.PENDING:
        raise ApiError(code="invalid_state", message="Only pending bookings can be declined.")
    booking.status = BookingStatus.DECLINED
    booking.decline_reason = reason
    booking.save(update_fields=["status", "decline_reason", "updated_at"])
    emails.send_booking_declined(booking)
    return booking


@transaction.atomic
def manual_override(booking, note):
    """PM-06 — moves a payment_failed booking to manually_approved, logged
    as an off-platform payment. Note is mandatory."""
    if not note:
        raise NoteRequired()
    if booking.status != BookingStatus.PAYMENT_FAILED:
        raise ApiError(code="invalid_state", message="Only payment_failed bookings can be manually overridden.")

    booking.status = BookingStatus.MANUALLY_APPROVED
    booking.manual_override_note = note
    booking.save(update_fields=["status", "manual_override_note", "updated_at"])

    _auto_decline_conflicts(booking)
    emails.send_booking_approved(booking)
    return booking


def apply_strike(booking):
    client = booking.client
    client.strike_count += 1
    if client.strike_count >= settings.STRIKE_HIGH_RISK_COUNT:
        client.high_risk_flag = True
    client.save(update_fields=["strike_count", "high_risk_flag", "updated_at"])
    emails.send_strike_warning(booking, client.strike_count)


@transaction.atomic
def mark_arrival(booking, arrival_status, note=""):
    if arrival_status == ArrivalStatus.NO_SHOW and not note:
        raise NoteRequired()

    booking.arrival_status = arrival_status
    booking.arrival_note = note
    booking.save(update_fields=["arrival_status", "arrival_note", "updated_at"])

    if arrival_status == ArrivalStatus.NO_SHOW:
        apply_strike(booking)
    return booking


@transaction.atomic
def client_cancel(booking):
    if booking.status not in (BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.MANUALLY_APPROVED):
        raise ApiError(code="invalid_state", message="This booking can no longer be cancelled online.")

    was_confirmed = booking.status in (BookingStatus.APPROVED, BookingStatus.MANUALLY_APPROVED)
    is_late = (booking.requested_start_time - timezone.now()) < timedelta(
        hours=settings.CLIENT_ACTION_CUTOFF_HOURS
    )

    booking.status = BookingStatus.CANCELLED
    booking.save(update_fields=["status", "updated_at"])

    # Client-initiated cancellations are never cash-refunded (PRD 8.2) — any
    # captured deposit/full payment simply stands as forfeited. Only a late
    # cancellation of an already-confirmed booking counts as a strike,
    # mirroring the no-show rule (8.1); an early cancel or a still-pending
    # request being withdrawn does not.
    if was_confirmed and is_late:
        apply_strike(booking)

    emails.send_cancellation_confirmation(booking)
    return booking


@transaction.atomic
def client_reschedule(booking, new_start_time):
    if booking.status not in (BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.MANUALLY_APPROVED):
        raise ApiError(code="invalid_state", message="This booking can no longer be rescheduled online.")

    if booking.reschedule_count >= 1:
        raise RescheduleLimitReached()

    if (booking.requested_start_time - timezone.now()) < timedelta(
        hours=settings.CLIENT_ACTION_CUTOFF_HOURS
    ):
        raise ActionCutoffPassed()

    required_duration_minutes = sum(item.duration_snapshot for item in booking.items.all())
    if not slot_is_available(new_start_time, required_duration_minutes, exclude_booking_id=booking.id):
        raise SlotUnavailable()

    booking.requested_start_time = new_start_time
    booking.service_end_time = new_start_time + timedelta(minutes=required_duration_minutes)
    booking.calendar_blocked_until = booking.service_end_time + timedelta(minutes=settings.BUFFER_MINUTES)
    booking.reschedule_count += 1
    booking.save()

    booking.client.reschedule_count_lifetime += 1
    booking.client.save(update_fields=["reschedule_count_lifetime", "updated_at"])

    emails.send_reschedule_confirmation(booking)
    return booking


@transaction.atomic
def resolve_conflict(booking, action, new_start_time=None):
    """AV-04 — the stylist processing an individual booking flagged by a
    blocked day. Deposit-free; does not touch the client's normal
    reschedule limit (PRD Section 5)."""
    if not booking.needs_resolution:
        raise ApiError(code="invalid_state", message="This booking is not in the resolution queue.")

    if action == "cancel":
        if booking.stripe_payment_intent_id:
            stripe_service.refund_payment_intent(booking.stripe_payment_intent_id)
        booking.status = BookingStatus.CANCELLED
        booking.resolved_at = timezone.now()
        booking.save(update_fields=["status", "resolved_at", "updated_at"])
        emails.send_blocked_day_resolution_cancelled(booking)
    elif action == "reschedule":
        if not new_start_time:
            raise ApiError(code="validation_error", message="new_start_time is required for a reschedule resolution.")
        required_duration_minutes = sum(item.duration_snapshot for item in booking.items.all())
        if not slot_is_available(new_start_time, required_duration_minutes, exclude_booking_id=booking.id):
            raise SlotUnavailable()

        booking.requested_start_time = new_start_time
        booking.service_end_time = new_start_time + timedelta(minutes=required_duration_minutes)
        booking.calendar_blocked_until = booking.service_end_time + timedelta(minutes=settings.BUFFER_MINUTES)
        booking.resolved_at = timezone.now()
        # Deliberately NOT incrementing reschedule_count — stylist-caused.
        booking.save()
        emails.send_blocked_day_resolution_reschedule(booking)
    else:
        raise ApiError(code="validation_error", message="action must be 'cancel' or 'reschedule'.")

    return booking


@transaction.atomic
def expire_stale_pending_bookings():
    """Run periodically (see management command `expire_pending_bookings`).
    PRD Section 3: an unactioned pending request auto-expires once its
    requested time passes; the slot frees up and the client is notified."""
    stale = Booking.objects.filter(status=BookingStatus.PENDING, requested_start_time__lt=timezone.now())
    count = 0
    for booking in stale:
        booking.status = BookingStatus.EXPIRED
        booking.save(update_fields=["status", "updated_at"])
        emails.send_expiry_notice(booking)
        count += 1
    return count
