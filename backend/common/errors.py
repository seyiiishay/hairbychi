"""
Central registry of API error codes.

The frontend maps these codes to user-facing copy (05-error-messages.md).
Every error response takes the shape:

    { "error": { "code": "...", "message": "..." } }

`message` is a safe, generic fallback — the frontend should prefer its own
copy keyed by `code` and only fall back to `message` for unmapped codes.
"""

from rest_framework.exceptions import APIException
from rest_framework import status


class ApiError(APIException):
    """Raise this anywhere in a view/service to produce the standard error shape."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "bad_request"
    default_message = "Something went wrong. Please try again."

    def __init__(self, code=None, message=None, status_code=None):
        self.code = code or self.default_code
        self.message = message or self.default_message
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail=self.message, code=self.code)


class SlotUnavailable(ApiError):
    default_code = "slot_unavailable"
    default_message = "That time is no longer available. Please pick another slot."
    status_code = status.HTTP_409_CONFLICT


class CaptchaFailed(ApiError):
    default_code = "captcha_failed"
    default_message = "We couldn't verify you're human. Please try the CAPTCHA again."
    status_code = status.HTTP_400_BAD_REQUEST


class PolicyNotAcknowledged(ApiError):
    default_code = "policy_not_acknowledged"
    default_message = "Please agree to the Terms & Cancellation Policy to continue."
    status_code = status.HTTP_400_BAD_REQUEST


class CardVerificationFailed(ApiError):
    default_code = "card_verification_failed"
    default_message = "We couldn't verify your card. Please try again or choose offline payment."
    status_code = status.HTTP_400_BAD_REQUEST


class HighRiskFullPaymentRequired(ApiError):
    default_code = "high_risk_full_payment_required"
    default_message = "Full payment is required upfront for this booking."
    status_code = status.HTTP_400_BAD_REQUEST


class RescheduleLimitReached(ApiError):
    default_code = "reschedule_limit_reached"
    default_message = "This booking has already been rescheduled once. Please cancel and submit a new request."
    status_code = status.HTTP_400_BAD_REQUEST


class ActionCutoffPassed(ApiError):
    default_code = "action_cutoff_passed"
    default_message = "It's too close to your appointment time to do this online. Please contact the stylist directly."
    status_code = status.HTTP_400_BAD_REQUEST


class InvalidToken(ApiError):
    default_code = "invalid_token"
    default_message = "This link is invalid or has expired."
    status_code = status.HTTP_404_NOT_FOUND


class InvalidTotpCode(ApiError):
    default_code = "invalid_totp_code"
    default_message = "Invalid code. Please try again."
    status_code = status.HTTP_401_UNAUTHORIZED


class InvalidBackupCode(ApiError):
    default_code = "invalid_backup_code"
    default_message = "Invalid or already-used backup code."
    status_code = status.HTTP_401_UNAUTHORIZED


class RateLimited(ApiError):
    default_code = "rate_limited"
    default_message = "Too many attempts. Please wait and try again."
    status_code = status.HTTP_429_TOO_MANY_REQUESTS


class Unauthorized(ApiError):
    default_code = "unauthorized"
    default_message = "Your session has expired. Please log in again."
    status_code = status.HTTP_401_UNAUTHORIZED


class NotFound(ApiError):
    default_code = "not_found"
    default_message = "Not found."
    status_code = status.HTTP_404_NOT_FOUND


class ProofRequired(ApiError):
    default_code = "proof_required"
    default_message = "Please attach proof of payment before approving this booking."
    status_code = status.HTTP_400_BAD_REQUEST


class NoteRequired(ApiError):
    default_code = "note_required"
    default_message = "A note is required for this action."
    status_code = status.HTTP_400_BAD_REQUEST


class ConflictExists(ApiError):
    default_code = "conflict_exists"
    default_message = "This booking conflicts with another approved booking."
    status_code = status.HTTP_409_CONFLICT
