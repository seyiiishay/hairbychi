"""
Slot computation for BK-03 (POST /api/availability/slots) and for
server-side re-validation when a booking is actually submitted or
rescheduled (never trust the client's chosen slot without re-checking).

Buffer handling (AV-06): the 30-minute buffer is added ONCE at the end of
the appointment and is never part of `required_duration_minutes` — callers
must pass the sum of selected services' `duration_minutes` only.
"""
from datetime import datetime, timedelta, timezone as dt_timezone
from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone

from .models import AvailabilityRecurring, AvailabilityBlock

DISPLAY_TZ = ZoneInfo(settings.DISPLAY_TIMEZONE)
UTC = dt_timezone.utc

SLOT_GRANULARITY_MINUTES = int(getattr(settings, "SLOT_GRANULARITY_MINUTES", 30))


def _occupied_ranges(date_from, date_to, exclude_booking_id=None):
    """[(start_utc, blocked_until_utc), ...] for every APPROVED booking in
    range. Pending bookings never occupy a slot — concurrent pending
    requests are allowed by design (PRD Section 3) and resolved by the
    stylist at approval time."""
    # Local import: bookings app is the one importing this module in the
    # normal request flow; this avoids a hard import-time coupling.
    from bookings.models import Booking, BookingStatus, OCCUPYING_STATUSES

    range_start = datetime.combine(date_from, datetime.min.time(), tzinfo=DISPLAY_TZ).astimezone(UTC)
    range_end = datetime.combine(date_to + timedelta(days=1), datetime.min.time(), tzinfo=DISPLAY_TZ).astimezone(
        UTC
    )

    qs = Booking.objects.filter(
        status__in=OCCUPYING_STATUSES,
        requested_start_time__lt=range_end,
        calendar_blocked_until__gt=range_start,
    )
    if exclude_booking_id:
        qs = qs.exclude(id=exclude_booking_id)
    return list(qs.values_list("requested_start_time", "calendar_blocked_until"))


def _blocked_dates(date_from, date_to):
    return set(
        AvailabilityBlock.objects.filter(date__gte=date_from, date__lte=date_to).values_list("date", flat=True)
    )


def _overlaps(a_start, a_end, b_start, b_end):
    return a_start < b_end and b_start < a_end


def compute_slots(date_from, date_to, required_duration_minutes):
    """Returns [{ "start": aware_utc_datetime, "service_end_time": aware_utc_datetime }, ...]"""
    buffer_minutes = settings.BUFFER_MINUTES
    occupied = _occupied_ranges(date_from, date_to)
    blocked_dates = _blocked_dates(date_from, date_to)
    now = timezone.now()

    rules_by_weekday = {}
    for rule in AvailabilityRecurring.objects.filter(is_active=True):
        rules_by_weekday.setdefault(rule.weekday, []).append(rule)

    slots = []
    current_date = date_from
    while current_date <= date_to:
        if current_date not in blocked_dates:
            weekday = current_date.weekday()  # Monday=0 .. Sunday=6, matches API contract
            for rule in rules_by_weekday.get(weekday, []):
                window_start = datetime.combine(current_date, rule.start_time, tzinfo=DISPLAY_TZ).astimezone(
                    UTC
                )
                window_end = datetime.combine(current_date, rule.end_time, tzinfo=DISPLAY_TZ).astimezone(
                    UTC
                )

                candidate = window_start
                step = timedelta(minutes=SLOT_GRANULARITY_MINUTES)
                duration = timedelta(minutes=required_duration_minutes)
                buffer_delta = timedelta(minutes=buffer_minutes)

                while candidate + duration <= window_end:
                    if candidate > now:
                        service_end = candidate + duration
                        blocked_until = service_end + buffer_delta
                        conflict = any(
                            _overlaps(candidate, blocked_until, occ_start, occ_end)
                            for occ_start, occ_end in occupied
                        )
                        if not conflict:
                            slots.append({"start": candidate, "service_end_time": service_end})
                    candidate += step

        current_date += timedelta(days=1)

    return slots


def slot_is_available(start_time, required_duration_minutes, exclude_booking_id=None):
    """Re-validates a single requested start time at submit/reschedule time."""
    service_end = start_time + timedelta(minutes=required_duration_minutes)
    blocked_until = service_end + timedelta(minutes=settings.BUFFER_MINUTES)

    if start_time <= timezone.now():
        return False

    if AvailabilityBlock.objects.filter(date=start_time.astimezone(DISPLAY_TZ).date()).exists():
        return False

    weekday = start_time.astimezone(DISPLAY_TZ).date().weekday()
    local_start = start_time.astimezone(DISPLAY_TZ).time()
    local_service_end = service_end.astimezone(DISPLAY_TZ).time()

    fits_a_window = False
    for rule in AvailabilityRecurring.objects.filter(is_active=True, weekday=weekday):
        if rule.start_time <= local_start and local_service_end <= rule.end_time:
            fits_a_window = True
            break
    if not fits_a_window:
        return False

    occupied = _occupied_ranges(start_time.date(), service_end.date(), exclude_booking_id=exclude_booking_id)
    for occ_start, occ_end in occupied:
        if _overlaps(start_time, blocked_until, occ_start, occ_end):
            return False

    return True
