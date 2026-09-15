from django.db import transaction
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from adminauth.permissions import IsAdminSession
from .models import AvailabilityRecurring, AvailabilityBlock
from .serializers import (
    AvailabilityRecurringSerializer,
    AvailabilityBlockSerializer,
    SlotsRequestSerializer,
)
from .slots import compute_slots


class SlotsView(APIView):
    """POST /api/availability/slots — BK-03. Public, rate-limited by the
    default anon throttle."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SlotsRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        slots = compute_slots(data["date_from"], data["date_to"], data["required_duration_minutes"])
        return Response(
            {
                "slots": [
                    {
                        "start": s["start"].isoformat(),
                        "service_end_time": s["service_end_time"].isoformat(),
                    }
                    for s in slots
                ]
            }
        )


class AdminAvailabilityRecurringListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminSession]
    serializer_class = AvailabilityRecurringSerializer
    queryset = AvailabilityRecurring.objects.all()
    pagination_class = None


class AdminAvailabilityRecurringDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminSession]
    serializer_class = AvailabilityRecurringSerializer
    queryset = AvailabilityRecurring.objects.all()


class AdminAvailabilityRecurringBulkView(APIView):
    """PUT /api/admin/availability/recurring/bulk — AV-01.
    Full replace: body is a flat JSON array of { weekday, start_time, end_time }.
    Weekdays/windows omitted from the body are removed."""

    permission_classes = [IsAdminSession]

    def put(self, request):
        payload = request.data
        if not isinstance(payload, list):
            return Response(
                {"error": {"code": "validation_error", "message": "Body must be a JSON array of rules."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AvailabilityRecurringSerializer(data=payload, many=True)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            AvailabilityRecurring.objects.all().delete()
            AvailabilityRecurring.objects.bulk_create(
                [AvailabilityRecurring(**item) for item in serializer.validated_data]
            )

        result = AvailabilityRecurringSerializer(AvailabilityRecurring.objects.all(), many=True).data
        return Response(result)


class AdminAvailabilityBlockView(generics.ListCreateAPIView):
    """POST /api/admin/availability/block — AV-02/03.
    Blocks the day immediately and flags any already-approved bookings that
    day for the resolution queue, per PRD Section 5."""

    permission_classes = [IsAdminSession]
    serializer_class = AvailabilityBlockSerializer
    queryset = AvailabilityBlock.objects.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        block, _created = AvailabilityBlock.objects.update_or_create(
            date=serializer.validated_data["date"],
            defaults={"reason": serializer.validated_data.get("reason", "")},
        )

        # Local import to avoid a hard bookings <-> availability coupling at
        # module load time.
        from bookings.models import Booking, BookingStatus, OCCUPYING_STATUSES
        from bookings.serializers import BookingAdminListSerializer
        from notifications.emails import send_blocked_day_generic_notice

        conflicts = []
        approved_that_day = Booking.objects.filter(status__in=OCCUPYING_STATUSES).select_related(
            "client"
        )
        for booking in approved_that_day:
            if booking.local_date() == block.date:
                booking.needs_resolution = True
                booking.save(update_fields=["needs_resolution", "updated_at"])
                send_blocked_day_generic_notice(booking)
                conflicts.append(booking)

        body = AvailabilityBlockSerializer(block).data
        body["conflicts"] = BookingAdminListSerializer(conflicts, many=True).data
        return Response(body, status=status.HTTP_201_CREATED)


class AdminAvailabilityBlockDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAdminSession]
    serializer_class = AvailabilityBlockSerializer
    queryset = AvailabilityBlock.objects.all()


class AdminResolutionQueueView(generics.ListAPIView):
    """GET /api/admin/availability/resolution-queue — AV-04."""

    permission_classes = [IsAdminSession]

    def get_queryset(self):
        from bookings.models import Booking

        return Booking.objects.filter(needs_resolution=True, resolved_at__isnull=True).order_by(
            "requested_start_time"
        )

    def get_serializer_class(self):
        from bookings.serializers import BookingAdminListSerializer

        return BookingAdminListSerializer
