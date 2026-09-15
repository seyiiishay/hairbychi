import logging

import stripe
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from . import stripe_service

logger = logging.getLogger("api.payments")


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    """POST /api/webhooks/stripe — backend only, never called by the frontend."""

    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.headers.get("Stripe-Signature", "")

        try:
            event = stripe_service.verify_webhook_signature(payload, sig_header)
        except (ValueError, stripe.error.SignatureVerificationError):
            logger.warning("Rejected Stripe webhook: bad signature")
            return HttpResponse(status=400)

        event_type = event["type"]
        logger.info("Stripe webhook received: %s", event_type)

        # Capture already happens synchronously in the approve flow
        # (payments/stripe_service.capture_amount). This handler exists so
        # async failures/disputes are at least logged for the stylist to
        # follow up on manually; wire up richer handling as needed.
        if event_type in ("payment_intent.payment_failed", "charge.dispute.created"):
            logger.warning("Stripe event needing attention: %s — %s", event_type, event["data"]["object"].get("id"))

        return HttpResponse(status=200)
