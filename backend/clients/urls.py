from django.urls import path

from .views import AdminClientDetailView, AdminClearHighRiskView

admin_urlpatterns = [
    path("clients/<uuid:pk>", AdminClientDetailView.as_view(), name="admin-client-detail"),
    path("clients/<uuid:pk>/clear-high-risk", AdminClearHighRiskView.as_view(), name="admin-client-clear-risk"),
]
