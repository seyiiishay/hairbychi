from django.urls import path

from .views import SetupIntentView, AdminProofUploadView
from .webhooks import StripeWebhookView

public_urlpatterns = [
    path("payments/setup-intent", SetupIntentView.as_view(), name="payments-setup-intent"),
]

admin_urlpatterns = [
    path("uploads/proof", AdminProofUploadView.as_view(), name="admin-uploads-proof"),
]

webhook_urlpatterns = [
    path("webhooks/stripe", StripeWebhookView.as_view(), name="webhooks-stripe"),
]
