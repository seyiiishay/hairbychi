from django.core import exceptions as django_exceptions
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from adminauth.permissions import IsAdminSession
from common.errors import ApiError, InvalidToken, NoteRequired
from .models import Booking, BookingStatus, ArrivalStatus
from .serializers import (
    BookingCreateSerializer,
    BookingCreateResponseSerializer,
    BookingGuestDetailSerializer,
    BookingAdminListSerializer,
    BookingAdminDetailSerializer,
    PrecheckSerializer,
)
from . import services


def _get_by_token(token):
    try:
        return Booking.objects.select_related("client").prefetch_related("items").get(manage_token=token)
    except Booking.DoesNotExist:
        raise InvalidToken()


def _client_ip(request):
    return request.META.get("REMOTE_ADDR")


# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------
class PrecheckView(APIView):
    """POST /api/bookings/precheck — see serializer docstring for why this
    exists beyond the documented contract."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PrecheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        result = services.precheck(data["service_ids"], data["email"], data["phone"])
        return Response(result)


class BookingCreateView(APIView):
    """POST /api/bookings — BK-05/06, PM-01."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = services.create_booking(serializer.validated_data, remote_ip=_client_ip(request))
        return Response(BookingCreateResponseSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingTokenDetailView(APIView):
    """GET /api/bookings/:token — GS-01/NT-03. Token != booking UUID;
    possession of the token is the auth."""

    permission_classes = [AllowAny]

    def get(self, request, token):
        booking = _get_by_token(token)
        return Response(BookingGuestDetailSerializer(booking).data)


class BookingCancelView(APIView):
    """POST /api/bookings/:token/cancel — GS-01."""

    permission_classes = [AllowAny]

    def post(self, request, token):
        booking = _get_by_token(token)
        booking = services.client_cancel(booking)
        return Response(BookingGuestDetailSerializer(booking).data)


class BookingRescheduleView(APIView):
    """POST /api/bookings/:token/reschedule — GS-02/03."""

    permission_classes = [AllowAny]

    def post(self, request, token):
        booking = _get_by_token(token)
        new_start_time = request.data.get("new_start_time")
        if not new_start_time:
            raise ApiError(code="validation_error", message="new_start_time is required.")
        from django.utils.dateparse import parse_datetime

        parsed = parse_datetime(new_start_time)
        if not parsed:
            raise ApiError(code="validation_error", message="new_start_time must be an ISO 8601 datetime.")
        booking = services.client_reschedule(booking, parsed)
        return Response(BookingGuestDetailSerializer(booking).data)


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
class AdminBookingListView(generics.ListAPIView):
    """GET /api/admin/bookings?status=pending&include_archived=false&page=1 — AD-01/03."""

    permission_classes = [IsAdminSession]
    serializer_class = BookingAdminListSerializer

    def get_queryset(self):
        qs = Booking.objects.select_related("client").order_by("-requested_start_time")
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        include_archived = self.request.query_params.get("include_archived", "false").lower() == "true"
        if not include_archived:
            qs = qs.filter(archived=False)
        return qs


class AdminBookingDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAdminSession]
    serializer_class = BookingAdminDetailSerializer
    queryset = Booking.objects.select_related("client").prefetch_related("items")


class AdminBookingApproveView(APIView):
    """POST /api/admin/bookings/:id/approve — BK-08, PM-03/05.
    Offline body: { proof_url, proof_note }."""

    permission_classes = [IsAdminSession]

    def post(self, request, pk):
        booking = generics.get_object_or_404(Booking, pk=pk)
        booking = services.approve_booking(
            booking,
            proof_url=request.data.get("proof_url"),
            proof_note=request.data.get("proof_note"),
        )
        return Response(BookingAdminDetailSerializer(booking).data)


class AdminBookingDeclineView(APIView):
    """POST /api/admin/bookings/:id/decline — BK-08. Reason optional."""

    permission_classes = [IsAdminSession]

    def post(self, request, pk):
        booking = generics.get_object_or_404(Booking, pk=pk)
        booking = services.decline_booking(booking, reason=request.data.get("reason", ""))
        return Response(BookingAdminDetailSerializer(booking).data)


class AdminBookingBatchView(APIView):
    """POST /api/admin/bookings/batch — AD-02.
    Body: { booking_ids: [...], action: 'approve'|'decline'|'archive' }.
    Per-ID failures are reported individually rather than failing the batch."""

    permission_classes = [IsAdminSession]

    ACTIONS = {
        "approve": lambda b: services.approve_booking(b),
        "decline": lambda b: services.decline_booking(b),
        "archive": None,  # handled inline — not a status transition
    }

    def post(self, request):
        booking_ids = request.data.get("booking_ids", [])
        action = request.data.get("action")
        if action not in ("approve", "decline", "archive"):
            raise ApiError(code="validation_error", message="action must be approve, decline, or archive.")

        results = []
        for booking_id in booking_ids:
            try:
                booking = Booking.objects.get(pk=booking_id)
                if action == "archive":
                    booking.archived = True
                    booking.save(update_fields=["archived", "updated_at"])
                else:
                    self.ACTIONS[action](booking)
                results.append({"id": booking_id, "success": True})
            except (Booking.DoesNotExist, ValueError, django_exceptions.ValidationError):
                results.append({"id": booking_id, "success": False, "error": "not_found"})
            except ApiError as exc:
                results.append({"id": booking_id, "success": False, "error": exc.code})

        return Response({"results": results})


class AdminBookingArrivalView(APIView):
    """POST /api/admin/bookings/:id/arrival — AD-04.
    Body: { arrival_status: 'arrived'|'no_show', note? }. no_show requires note."""

    permission_classes = [IsAdminSession]

    def post(self, request, pk):
        booking = generics.get_object_or_404(Booking, pk=pk)
        arrival_status = request.data.get("arrival_status")
        if arrival_status not in ArrivalStatus.values:
            raise ApiError(code="validation_error", message="arrival_status must be 'arrived' or 'no_show'.")
        booking = services.mark_arrival(booking, arrival_status, note=request.data.get("note", ""))
        return Response(BookingAdminDetailSerializer(booking).data)


class AdminBookingManualOverrideView(APIView):
    """POST /api/admin/bookings/:id/manual-override — PM-06. Note required."""

    permission_classes = [IsAdminSession]

    def post(self, request, pk):
        booking = generics.get_object_or_404(Booking, pk=pk)
        note = request.data.get("note", "")
        if not note:
            raise NoteRequired()
        booking = services.manual_override(booking, note)
        return Response(BookingAdminDetailSerializer(booking).data)


class AdminBookingResolveConflictView(APIView):
    """POST /api/admin/bookings/:id/resolve-conflict — AV-04 processing.
    Body: { action: 'cancel'|'reschedule', new_start_time? }. Not in the
    original checklist table but required to implement the blocked-day
    resolution workflow described in PRD Section 5."""

    permission_classes = [IsAdminSession]

    def post(self, request, pk):
        booking = generics.get_object_or_404(Booking, pk=pk)
        action = request.data.get("action")
        new_start_time = None
        if action == "reschedule":
            from django.utils.dateparse import parse_datetime

            new_start_time = parse_datetime(request.data.get("new_start_time", ""))
        booking = services.resolve_conflict(booking, action, new_start_time=new_start_time)
        return Response(BookingAdminDetailSerializer(booking).data)
