from rest_framework import serializers

from .models import Booking, BookingItem, PaymentMethod


class BookingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingItem
        fields = ["name_snapshot", "price_snapshot", "duration_snapshot"]


class ClientInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=160)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=32)


class BookingCreateSerializer(serializers.Serializer):
    """POST /api/bookings (BK-05/06). Never accepts duration/end time/buffer
    — the backend computes those."""

    client = ClientInputSerializer()
    service_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)
    requested_start_time = serializers.DateTimeField()
    payment_method = serializers.ChoiceField(choices=PaymentMethod.choices)
    policy_acknowledged = serializers.BooleanField()
    captcha_token = serializers.CharField(allow_blank=True, required=False, default="")
    stripe_setup_intent_id = serializers.CharField(allow_blank=True, required=False, default="")


class PrecheckSerializer(serializers.Serializer):
    """Not in the original API checklist — added to satisfy the PRD's
    inline strike-warning requirement (Section 7 / ST-06) before the guest
    reaches the payment step. See docs deviation note in the README."""

    service_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    phone = serializers.CharField(required=False, allow_blank=True, default="")


class BookingCreateResponseSerializer(serializers.ModelSerializer):
    strike_warning = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "status",
            "service_end_time",
            "amount_due_today",
            "deposit_amount",
            "full_payment_required",
            "strike_warning",
            "manage_token",
        ]

    def get_strike_warning(self, obj):
        return getattr(obj, "_strike_warning", False)


class BookingGuestDetailSerializer(serializers.ModelSerializer):
    """GET /api/bookings/:token and the confirm/manage screens. Deliberately
    excludes calendar_blocked_until (buffer end) — clients only ever see
    service_end_time."""

    items = BookingItemSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "status",
            "requested_start_time",
            "service_end_time",
            "payment_method",
            "total_price",
            "deposit_amount",
            "amount_due_today",
            "full_payment_required",
            "reschedule_count",
            "items",
            "client_name",
        ]


class BookingAdminListSerializer(serializers.ModelSerializer):
    conflict_flag = serializers.SerializerMethodField()
    client_id = serializers.UUIDField(source="client.id", read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    client_email = serializers.CharField(source="client.email", read_only=True)
    client_phone = serializers.CharField(source="client.phone", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "status",
            "requested_start_time",
            "service_end_time",
            "calendar_blocked_until",
            "payment_method",
            "total_price",
            "deposit_amount",
            "amount_due_today",
            "full_payment_required",
            "conflict_flag",
            "needs_resolution",
            "arrival_status",
            "archived",
            "client_id",
            "client_name",
            "client_email",
            "client_phone",
        ]

    def get_conflict_flag(self, obj):
        return obj.has_conflict()


class BookingAdminDetailSerializer(BookingAdminListSerializer):
    items = BookingItemSerializer(many=True, read_only=True)

    class Meta(BookingAdminListSerializer.Meta):
        fields = BookingAdminListSerializer.Meta.fields + [
            "items",
            "proof_url",
            "proof_note",
            "decline_reason",
            "manual_override_note",
            "arrival_note",
            "reschedule_count",
            "manage_token",
            "created_at",
        ]
