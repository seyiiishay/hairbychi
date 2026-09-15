import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { createSetupIntent, precheckBooking, createBooking } from "../../api/endpoints";
import type { PaymentMethod, PrecheckResponse } from "../../api/types";
import { ApiRequestError } from "../../api/client";
import { errorMessage } from "../../lib/errors";
import { money } from "../../lib/timezone";
import CaptchaWidget from "../../components/CaptchaWidget";
import StripeCardForm from "../../components/StripeCardForm";
import { Card, ErrorBanner, InfoBanner, PrimaryButton, SecondaryButton, Spinner, WizardSteps } from "../../components/Shared";

export default function Payment() {
  const { items, totalPrice, guestDetails, policyAcknowledged, selectedSlotStart } = useCart();
  const navigate = useNavigate();

  const [preview, setPreview] = useState<PrecheckResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const serviceIds = items.map((i) => i.id);

  useEffect(() => {
    if (!guestDetails) return;
    precheckBooking(serviceIds, guestDetails.email, guestDetails.phone)
      .then(setPreview)
      .catch(() => {
        /* precheck is a UX nicety — booking submission still re-validates server-side */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestDetails?.email, guestDetails?.phone]);

  useEffect(() => {
    if (paymentMethod !== "online" || clientSecret) return;
    createSetupIntent()
      .then((res) => setClientSecret(res.client_secret))
      .catch(() => setError("Couldn't start card verification. Please try again."));
  }, [paymentMethod, clientSecret]);

  if (items.length === 0 || !selectedSlotStart || !guestDetails) {
    navigate("/");
    return null;
  }

  const canSubmit =
    !!captchaToken &&
    policyAcknowledged &&
    (paymentMethod === "offline" || (paymentMethod === "online" && !!setupIntentId));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await createBooking({
        client: guestDetails,
        service_ids: serviceIds,
        requested_start_time: selectedSlotStart,
        payment_method: paymentMethod,
        policy_acknowledged: policyAcknowledged,
        captcha_token: captchaToken || "",
        stripe_setup_intent_id: paymentMethod === "online" ? setupIntentId || "" : undefined,
      });
      // The cart is cleared by the Confirm page itself (not here) — clearing
      // it in this handler would update cart state while Payment is still
      // mounted, tripping this page's own empty-cart guard and redirecting
      // to "/" before the navigation below takes effect.
      navigate("/book/confirm", { state: response });
    } catch (err) {
      if (err instanceof ApiRequestError) setError(errorMessage(err.code, err.message));
      else setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <WizardSteps current={4} />
      <h1 className="text-2xl font-semibold text-stone-900">Payment</h1>

      {preview?.strike_warning && (
        <InfoBanner>
          Heads up — your next missed appointment or late cancellation will require full payment upfront for any
          future booking.
        </InfoBanner>
      )}

      <Card className="bg-stone-50">
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Service total</span>
          <span className="font-medium text-stone-900">{money(totalPrice)}</span>
        </div>
        {preview && (
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-stone-500">
              {preview.full_payment_required ? "Full payment due now" : "Deposit due now"}
            </span>
            <span className="font-medium text-stone-900">{money(preview.amount_due_today)}</span>
          </div>
        )}
        {preview?.full_payment_required && (
          <p className="mt-2 text-xs text-amber-700">
            Full payment is required upfront for this booking, per our no-show policy.
          </p>
        )}
      </Card>

      <div>
        <p className="mb-2 text-sm font-medium text-stone-700">How would you like to pay?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setPaymentMethod("online")}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium ${
              paymentMethod === "online" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-stone-300 text-stone-600"
            }`}
          >
            Pay online (card)
          </button>
          <button
            onClick={() => setPaymentMethod("offline")}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium ${
              paymentMethod === "offline" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-stone-300 text-stone-600"
            }`}
          >
            Pay offline (cash / e-transfer)
          </button>
        </div>
      </div>

      {paymentMethod === "online" ? (
        clientSecret ? (
          <StripeCardForm clientSecret={clientSecret} onReady={setSetupIntentId} />
        ) : (
          <Spinner />
        )
      ) : (
        <InfoBanner>
          No card is charged now. Arrange payment directly with the stylist — your request won't be approved until
          she's confirmed she received it.
        </InfoBanner>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-stone-700">Quick human check</p>
        <CaptchaWidget onVerify={setCaptchaToken} />
      </div>

      <ErrorBanner message={error} />

      <div className="flex justify-between">
        <SecondaryButton onClick={() => navigate("/book/details")}>Back</SecondaryButton>
        <PrimaryButton disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? "Submitting…" : "Submit request"}
        </PrimaryButton>
      </div>
    </div>
  );
}
