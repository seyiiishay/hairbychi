import secrets

from django.db import models

from common.models import UUIDModel, TimestampedModel
from common.timezones import DISPLAY_TZ
from clients.models import Client
from catalog.models import Service


class BookingStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    DECLINED = "declined", "Declined"
    CANCELLED = "cancelled", "Cancelled"
    EXPIRED = "expired", "Expired"
    PAYMENT_FAILED = "payment_failed", "Payment failed"
    MANUALLY_APPROVED = "manually_approved", "Manually approved"


# Statuses that hold a real slot on the calendar / block availability.
# (Kept as a plain module constant, not a class attribute on BookingStatus —
# Django's Choices metaclass would otherwise try to treat an attribute
# assigned there as another enum member.)
OCCUPYING_STATUSES = [BookingStatus.APPROVED, BookingStatus.MANUALLY_APPROVED]


class PaymentMethod(models.TextChoices):
    ONLINE = "online", "Online"
    OFFLINE = "offline", "Offline"


class ArrivalStatus(models.TextChoices):
    NONE = "none", "Not yet recorded"
    ARRIVED = "arrived", "Arrived"
    NO_SHOW = "no_show", "No-show"


def generate_manage_token():
    return secrets.token_urlsafe(32)


class Booking(UUIDModel, TimestampedModel):
    client = models.ForeignKey(Client, related_name="bookings", on_delete=models.PROTECT)

    requested_start_time = models.DateTimeField()
    service_end_time = models.DateTimeField()
    # End of the 30-min post-appointment buffer. Never exposed to clients.
    calendar_blocked_until = models.DateTimeField()

    status = models.CharField(max_length=32, choices=BookingStatus.choices, default=BookingStatus.PENDING)
    payment_method = models.CharField(max_length=16, choices=PaymentMethod.choices)

    total_price = models.DecimalField(max_digits=8, decimal_places=2)
    deposit_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    amount_due_today = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    full_payment_required = models.BooleanField(default=False)

    policy_acknowledged = models.BooleanField(default=False)

    stripe_setup_intent_id = models.CharField(max_length=255, blank=True, default="")
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, default="")

    proof_url = models.URLField(blank=True, default="")
    proof_note = models.TextField(blank=True, default="")

    decline_reason = models.TextField(blank=True, default="")
    manual_override_note = models.TextField(blank=True, default="")

    # AV-04 resolution queue (blocked-day flow) — separate from ordinary
    # concurrent-pending conflicts, which are computed on the fly (see
    # `has_conflict`) rather than stored, to avoid staleness bugs.
    needs_resolution = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    manage_token = models.CharField(max_length=64, unique=True, default=generate_manage_token)
    reschedule_count = models.PositiveIntegerField(default=0)

    arrival_status = models.CharField(max_length=16, choices=ArrivalStatus.choices, default=ArrivalStatus.NONE)
    arrival_note = models.TextField(blank=True, default="")

    archived = models.BooleanField(default=False)

    class Meta:
        ordering = ["-requested_start_time"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["requested_start_time"]),
            models.Index(fields=["manage_token"]),
        ]

    def __str__(self):
        return f"{self.client.name} @ {self.requested_start_time} ({self.status})"

    def local_date(self):
        return self.requested_start_time.astimezone(DISPLAY_TZ).date()

    def has_conflict(self):
        """True if this booking overlaps another active booking's occupied
        range, or is sitting unresolved in the blocked-day resolution queue.
        Computed on read rather than stored, so it can never go stale."""
        if self.needs_resolution and not self.resolved_at:
            return True
        return (
            Booking.objects.filter(
                status__in=[BookingStatus.PENDING, *OCCUPYING_STATUSES],
                requested_start_time__lt=self.calendar_blocked_until,
                calendar_blocked_until__gt=self.requested_start_time,
            )
            .exclude(id=self.id)
            .exists()
        )


class BookingItem(models.Model):
    """Snapshotted at booking time — editing a Service's price/duration later
    never rewrites historical booking_items (PRD Section 9)."""

    id = models.BigAutoField(primary_key=True)
    booking = models.ForeignKey(Booking, related_name="items", on_delete=models.CASCADE)
    service = models.ForeignKey(Service, related_name="+", null=True, on_delete=models.SET_NULL)

    name_snapshot = models.CharField(max_length=160)
    price_snapshot = models.DecimalField(max_digits=8, decimal_places=2)
    duration_snapshot = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.name_snapshot} (${self.price_snapshot})"
