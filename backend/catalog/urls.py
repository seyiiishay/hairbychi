from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PublicCategoryListView, AdminCategoryViewSet, AdminServiceViewSet

admin_router = DefaultRouter(trailing_slash=False)
admin_router.register("categories", AdminCategoryViewSet, basename="admin-category")
admin_router.register("services", AdminServiceViewSet, basename="admin-service")

public_urlpatterns = [
    path("categories", PublicCategoryListView.as_view(), name="public-categories"),
]

admin_urlpatterns = [
    path("", include(admin_router.urls)),
]
