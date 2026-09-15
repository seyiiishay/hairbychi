from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny

from adminauth.permissions import IsAdminSession
from .models import Category, Service
from .serializers import CategoryPublicSerializer, CategoryAdminSerializer, ServiceSerializer


class PublicCategoryListView(generics.ListAPIView):
    """GET /api/categories — BK-01. Paginated; each category nests its
    active services (not separately paginated)."""

    permission_classes = [AllowAny]
    serializer_class = CategoryPublicSerializer
    queryset = Category.objects.filter(is_active=True).prefetch_related("services")


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """/api/admin/categories — AD-05."""

    permission_classes = [IsAdminSession]
    serializer_class = CategoryAdminSerializer
    queryset = Category.objects.all()


class AdminServiceViewSet(viewsets.ModelViewSet):
    """/api/admin/services — AD-05. No deposit fields accepted/returned."""

    permission_classes = [IsAdminSession]
    serializer_class = ServiceSerializer
    queryset = Service.objects.select_related("category").all()
