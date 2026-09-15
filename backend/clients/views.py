from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from adminauth.permissions import IsAdminSession
from .models import Client
from .serializers import ClientAdminSerializer


class AdminClientDetailView(generics.RetrieveAPIView):
    """GET /api/admin/clients/:id — AD-06."""

    permission_classes = [IsAdminSession]
    serializer_class = ClientAdminSerializer
    queryset = Client.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        data = self.get_serializer(instance).data

        # Local import avoids a hard module-load-time dependency from
        # clients -> bookings (bookings already depends on clients.models).
        from bookings.serializers import BookingAdminListSerializer

        bookings_qs = instance.bookings.order_by("-requested_start_time")
        data["bookings"] = BookingAdminListSerializer(bookings_qs, many=True).data
        return Response(data)


class AdminClearHighRiskView(APIView):
    """POST /api/admin/clients/:id/clear-high-risk — ST-04.
    Manual only; does not reset strike_count (PRD 8.1 redemption note)."""

    permission_classes = [IsAdminSession]

    def post(self, request, pk):
        client = generics.get_object_or_404(Client, pk=pk)
        note = request.data.get("note", "")
        client.high_risk_flag = False
        if note:
            client.high_risk_cleared_note = note
        client.save(update_fields=["high_risk_flag", "high_risk_cleared_note", "updated_at"])
        return Response(ClientAdminSerializer(client).data, status=status.HTTP_200_OK)
