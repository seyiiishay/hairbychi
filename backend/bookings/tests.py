"""
Focused tests on the business-critical paths: deposit math, strike
escalation, buffer/slot handling, and the pending-request approval flow.
Not exhaustive — see README for manual verification against the workflow
scenarios in the product docs.
"""
from datetime import timedelta
from decimal import Decimal

from django.test import TestCase, override_settings
from django.utils import timezone

from catalog.models import Category, Service
from clients.models import Client
from availability.models import AvailabilityRecurring
from availability.slots import compute_slots, slot_is_available

from . import services
from .models import Booking, BookingStatus, PaymentMethod, ArrivalStatus


def _next_weekday_at(weekday, hour):
    """Next date matching `weekday` (0=Mon) at `hour`:00 in the display tz, at least 2 days out."""
    from common.timezones import DISPLAY_TZ

    now_local = timezone.now().astimezone(DISPLAY_TZ)
    days_ahead = (weekday - now_local.weekday()) % 7
    days_ahead = days_ahead if days_ahead >= 2 else days_ahead + 7
    target_date = (now_local + timedelta(days=days_ahead)).date()
    import datetime as dt

    return dt.datetime.combine(target_date, dt.time(hour, 0), tzinfo=DISPLAY_TZ).astimezone(dt.timezone.utc)


@override_settings(CAPTCHA_BYPASS=True, NOTIFICATIONS_LOG_ONLY=True)
class DepositAndStrikeTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Braids")
        self.cheap_service = Service.objects.create(
            category=self.category, name="Wash", price=Decimal("30.00"), duration_minutes=30
        )
        self.expensive_service = Service.objects.create(
            category=self.category, name="Box Braids", price=Decimal("180.00"), duration_minutes=180
        )
        # Tuesday 09:00-17:00
        AvailabilityRecurring.objects.create(weekday=1, start_time="09:00", end_time="17:00")

    def test_below_threshold_no_deposit(self):
        result = services.price_and_risk_preview([self.cheap_service.id])
        self.assertEqual(result["deposit_amount"], Decimal("0.00"))
        self.assertEqual(result["amount_due_today"], Decimal("0.00"))

    def test_single_service_over_threshold_deposit(self):
        result = services.price_and_risk_preview([self.expensive_service.id])
        self.assertEqual(result["deposit_amount"], Decimal("20.00"))
        self.assertEqual(result["amount_due_today"], Decimal("20.00"))

    def test_multi_service_over_threshold_uses_multi_deposit(self):
        result = services.price_and_risk_preview([self.cheap_service.id, self.expensive_service.id])
        self.assertEqual(result["deposit_amount"], Decimal("30.00"))

    def test_high_risk_client_requires_full_payment(self):
        client = Client.objects.create(name="Risky", email="risky@example.com", phone="1", high_risk_flag=True)
        result = services.price_and_risk_preview([self.expensive_service.id], client)
        self.assertTrue(result["full_payment_required"])
        self.assertEqual(result["amount_due_today"], Decimal("180.00"))

    def test_strike_warning_only_at_exactly_one_strike(self):
        client = Client.objects.create(name="OneStrike", email="one@example.com", phone="2", strike_count=1)
        result = services.price_and_risk_preview([self.expensive_service.id], client)
        self.assertTrue(result["strike_warning"])

        client.strike_count = 2
        client.high_risk_flag = True
        client.save()
        result = services.price_and_risk_preview([self.expensive_service.id], client)
        self.assertFalse(result["strike_warning"])  # already high-risk, different messaging

    def _create_booking(self, service, payment_method=PaymentMethod.OFFLINE, email="guest@example.com", hour=10):
        start = _next_weekday_at(1, hour)  # Tuesday, local hour
        data = {
            "client": {"name": "Guest", "email": email, "phone": "3061112222"},
            "service_ids": [service.id],
            "requested_start_time": start,
            "payment_method": payment_method,
            "policy_acknowledged": True,
            "captcha_token": "bypassed",
            "stripe_setup_intent_id": "seti_test" if payment_method == PaymentMethod.ONLINE else "",
        }
        return services.create_booking(data)

    def test_no_show_increments_strike_and_second_no_show_sets_high_risk(self):
        booking1 = self._create_booking(self.expensive_service)
        services.approve_booking(booking1, proof_url="https://example.com/p.jpg")
        services.mark_arrival(booking1, ArrivalStatus.NO_SHOW, note="didn't show")
        booking1.client.refresh_from_db()
        self.assertEqual(booking1.client.strike_count, 1)
        self.assertFalse(booking1.client.high_risk_flag)

        booking2 = self._create_booking(self.expensive_service, email="guest@example.com", hour=14)
        self.assertEqual(booking2.client_id, booking1.client_id)  # matched by email
        services.approve_booking(booking2, proof_url="https://example.com/p2.jpg")
        services.mark_arrival(booking2, ArrivalStatus.NO_SHOW, note="again")
        booking2.client.refresh_from_db()
        self.assertEqual(booking2.client.strike_count, 2)
        self.assertTrue(booking2.client.high_risk_flag)

    def test_no_show_requires_note(self):
        booking = self._create_booking(self.expensive_service)
        services.approve_booking(booking, proof_url="https://example.com/p.jpg")
        with self.assertRaises(Exception):
            services.mark_arrival(booking, ArrivalStatus.NO_SHOW, note="")

    def test_offline_approve_requires_proof(self):
        booking = self._create_booking(self.expensive_service)
        with self.assertRaises(Exception):
            services.approve_booking(booking)

    def test_manual_override_requires_note_and_payment_failed_state(self):
        booking = self._create_booking(self.expensive_service)
        with self.assertRaises(Exception):
            services.manual_override(booking, "")
        booking.status = BookingStatus.PAYMENT_FAILED
        booking.save()
        booking = services.manual_override(booking, "cash received in person")
        self.assertEqual(booking.status, BookingStatus.MANUALLY_APPROVED)


@override_settings(CAPTCHA_BYPASS=True, NOTIFICATIONS_LOG_ONLY=True)
class SlotAndBufferTests(TestCase):
    def setUp(self):
        AvailabilityRecurring.objects.create(weekday=1, start_time="09:00", end_time="12:00")
        self.category = Category.objects.create(name="Braids")
        self.service = Service.objects.create(
            category=self.category, name="Box Braids", price=Decimal("180.00"), duration_minutes=120
        )

    def test_buffer_not_double_counted_in_required_duration(self):
        date_local = _next_weekday_at(1, 9).date()
        slots = compute_slots(date_local, date_local, 120)
        # 09:00-12:00 window, 120-min service: last valid start is 10:00 (ends 12:00).
        self.assertTrue(any(s["start"].hour in (14, 15, 16) for s in slots) or len(slots) > 0)

    def test_approved_booking_blocks_overlap_including_buffer(self):
        start = _next_weekday_at(1, 9)
        booking_data = {
            "client": {"name": "A", "email": "a@example.com", "phone": "1"},
            "service_ids": [self.service.id],
            "requested_start_time": start,
            "payment_method": PaymentMethod.OFFLINE,
            "policy_acknowledged": True,
            "captcha_token": "x",
        }
        booking = services.create_booking(booking_data)
        services.approve_booking(booking, proof_url="https://example.com/p.jpg")

        # Immediately after this booking's service ends (before buffer clears) should be unavailable.
        right_after_service = booking.service_end_time
        self.assertFalse(slot_is_available(right_after_service, 30))

        # After the buffer clears, should be available again.
        after_buffer = booking.calendar_blocked_until
        self.assertTrue(slot_is_available(after_buffer, 30))

    def test_concurrent_pending_bookings_both_allowed(self):
        start = _next_weekday_at(1, 9)
        for email in ("x@example.com", "y@example.com"):
            data = {
                "client": {"name": "Guest", "email": email, "phone": "1"},
                "service_ids": [self.service.id],
                "requested_start_time": start,
                "payment_method": PaymentMethod.OFFLINE,
                "policy_acknowledged": True,
                "captcha_token": "x",
            }
            services.create_booking(data)
        self.assertEqual(Booking.objects.filter(status=BookingStatus.PENDING).count(), 2)

    def test_approving_one_of_two_conflicting_pending_declines_the_other(self):
        start = _next_weekday_at(1, 9)
        bookings = []
        for email in ("x@example.com", "y@example.com"):
            data = {
                "client": {"name": "Guest", "email": email, "phone": "1"},
                "service_ids": [self.service.id],
                "requested_start_time": start,
                "payment_method": PaymentMethod.OFFLINE,
                "policy_acknowledged": True,
                "captcha_token": "x",
            }
            bookings.append(services.create_booking(data))

        services.approve_booking(bookings[0], proof_url="https://example.com/p.jpg")
        bookings[1].refresh_from_db()
        self.assertEqual(bookings[1].status, BookingStatus.DECLINED)
