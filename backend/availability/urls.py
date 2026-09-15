from django.urls import path

from .views import (
    SlotsView,
    AdminAvailabilityRecurringListCreateView,
    AdminAvailabilityRecurringDetailView,
    AdminAvailabilityRecurringBulkView,
    AdminAvailabilityBlockView,
    AdminAvailabilityBlockDetailView,
    AdminResolutionQueueView,
)

public_urlpatterns = [
    path("availability/slots", SlotsView.as_view(), name="availability-slots"),
]

admin_urlpatterns = [
    path(
        "availability/recurring/bulk",
        AdminAvailabilityRecurringBulkView.as_view(),
        name="admin-availability-recurring-bulk",
    ),
    path(
        "availability/recurring",
        AdminAvailabilityRecurringListCreateView.as_view(),
        name="admin-availability-recurring-list",
    ),
    path(
        "availability/recurring/<int:pk>",
        AdminAvailabilityRecurringDetailView.as_view(),
        name="admin-availability-recurring-detail",
    ),
    path("availability/block", AdminAvailabilityBlockView.as_view(), name="admin-availability-block"),
    path(
        "availability/block/<int:pk>",
        AdminAvailabilityBlockDetailView.as_view(),
        name="admin-availability-block-detail",
    ),
    path(
        "availability/resolution-queue",
        AdminResolutionQueueView.as_view(),
        name="admin-availability-resolution-queue",
    ),
]
