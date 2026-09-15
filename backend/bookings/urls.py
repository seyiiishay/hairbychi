from django.urls import path

from .views import (
    PrecheckView,
    BookingCreateView,
    BookingTokenDetailView,
    BookingCancelView,
    BookingRescheduleView,
    AdminBookingListView,
    AdminBookingDetailView,
    AdminBookingApproveView,
    AdminBookingDeclineView,
    AdminBookingBatchView,
    AdminBookingArrivalView,
    AdminBookingManualOverrideView,
    AdminBookingResolveConflictView,
)

public_urlpatterns = [
    path("bookings/precheck", PrecheckView.as_view(), name="bookings-precheck"),
    path("bookings", BookingCreateView.as_view(), name="bookings-create"),
    path("bookings/<str:token>", BookingTokenDetailView.as_view(), name="bookings-token-detail"),
    path("bookings/<str:token>/cancel", BookingCancelView.as_view(), name="bookings-token-cancel"),
    path("bookings/<str:token>/reschedule", BookingRescheduleView.as_view(), name="bookings-token-reschedule"),
]

admin_urlpatterns = [
    path("bookings/batch", AdminBookingBatchView.as_view(), name="admin-bookings-batch"),
    path("bookings", AdminBookingListView.as_view(), name="admin-bookings-list"),
    path("bookings/<uuid:pk>", AdminBookingDetailView.as_view(), name="admin-bookings-detail"),
    path("bookings/<uuid:pk>/approve", AdminBookingApproveView.as_view(), name="admin-bookings-approve"),
    path("bookings/<uuid:pk>/decline", AdminBookingDeclineView.as_view(), name="admin-bookings-decline"),
    path("bookings/<uuid:pk>/arrival", AdminBookingArrivalView.as_view(), name="admin-bookings-arrival"),
    path(
        "bookings/<uuid:pk>/manual-override",
        AdminBookingManualOverrideView.as_view(),
        name="admin-bookings-manual-override",
    ),
    path(
        "bookings/<uuid:pk>/resolve-conflict",
        AdminBookingResolveConflictView.as_view(),
        name="admin-bookings-resolve-conflict",
    ),
]
