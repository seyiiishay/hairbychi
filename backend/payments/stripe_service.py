"""
Thin wrapper around Stripe. Online payments never charge at submit time —
a SetupIntent only saves the card; the actual capture happens on approval
(PRD Section 3, step 8) for the deposit or full amount (Section 8.1).
"""
import logging

import stripe
from django.conf import settings

from common.errors import CardVerificationFailed

logger = logging.getLogger("api.payments")


def _client():
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def create_setup_intent():
    """Backs the Stripe Elements card-collection step (BK-06 / PM-01).
    Not in the original API checklist table but required for Stripe.js to
    have a client_secret to confirm against — added to close that gap."""
    client = _client()
    intent = client.SetupIntent.create(usage="off_session")
    return {"client_secret": intent.client_secret, "setup_intent_id": intent.id}


def capture_amount(setup_intent_id, amount_decimal, currency="cad"):
    """
    Retrieves the saved payment method from the SetupIntent and charges it
    off-session for `amount_decimal` (deposit or full amount). Raises
    CardVerificationFailed on any decline/error — callers should catch this
    and route the booking to the payment_failed / manual-override path
    (PM-06) rather than silently approving.
    """
    client = _client()
    try:
        setup_intent = client.SetupIntent.retrieve(setup_intent_id)
        payment_method_id = setup_intent.payment_method
        if not payment_method_id:
            raise CardVerificationFailed()

        amount_cents = int(round(amount_decimal * 100))
        payment_intent = client.PaymentIntent.create(
            amount=amount_cents,
            currency=currency,
            payment_method=payment_method_id,
            payment_method_types=["card"],
            confirm=True,
            off_session=True,
        )
        if payment_intent.status != "succeeded":
            raise CardVerificationFailed()
        return payment_intent.id
    except CardVerificationFailed:
        raise
    except stripe.error.StripeError:
        logger.exception("Stripe capture failed for setup_intent=%s", setup_intent_id)
        raise CardVerificationFailed()


def verify_webhook_signature(payload, sig_header):
    return stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)


def refund_payment_intent(payment_intent_id):
    """Stylist-fault refunds only (PRD Section 8.2) — used when the stylist
    resolves a blocked-day conflict by cancelling an already-paid booking."""
    if not payment_intent_id:
        return None
    client = _client()
    try:
        return client.Refund.create(payment_intent=payment_intent_id)
    except stripe.error.StripeError:
        logger.exception("Stripe refund failed for payment_intent=%s", payment_intent_id)
        return None
