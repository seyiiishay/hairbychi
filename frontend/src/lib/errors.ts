// Maps API error codes to user-facing copy.
//
// NOTE: 05-error-messages.md (the canonical copy doc referenced by the
// frontend guide) was not included in the uploaded docs for this build.
// The strings below are reasonable, non-technical placeholders written to
// match each error code's documented meaning — swap them for the official
// copy once that doc is available. They deliberately never surface a raw
// Stripe error or a stack trace.
export const ERROR_COPY: Record<string, string> = {
  slot_unavailable: "Sorry, that time was just taken. Please pick another slot.",
  captcha_failed: "We couldn't verify you're human. Please try the CAPTCHA again.",
  policy_not_acknowledged: "Please agree to the Terms & Cancellation Policy to continue.",
  card_verification_failed:
    "We couldn't verify your card. Please try again, or choose to pay offline instead.",
  high_risk_full_payment_required: "Full payment is required upfront for this booking.",
  reschedule_limit_reached:
    "This booking has already been rescheduled once. Please cancel it and submit a new request for a different time.",
  action_cutoff_passed:
    "It's too close to your appointment time to do this online. Please contact the stylist directly.",
  invalid_token: "This link is invalid or has expired.",
  invalid_totp_code: "Invalid code. Please try again.",
  invalid_backup_code: "Invalid or already-used backup code.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
  unauthorized: "Your session has expired. Please log in again.",
  not_found: "We couldn't find that.",
  proof_required: "Please attach proof of payment before approving this booking.",
  note_required: "A note is required for this action.",
  conflict_exists: "This booking conflicts with another approved booking.",
  validation_error: "Please check your input and try again.",
  forbidden: "You don't have permission to do that.",
  internal_error: "Something went wrong. Please try again.",
};

export function errorMessage(code: string | undefined, fallback?: string): string {
  if (code && ERROR_COPY[code]) return ERROR_COPY[code];
  return fallback || "Something went wrong. Please try again.";
}
