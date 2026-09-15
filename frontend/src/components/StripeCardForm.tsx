import { useState } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PrimaryButton, ErrorBanner } from "./Shared";
import { errorMessage } from "../lib/errors";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: { fontSize: "16px", color: "#1c1917", "::placeholder": { color: "#a8a29e" } },
  },
};

function InnerForm({
  clientSecret,
  onReady,
  disabled,
}: {
  clientSecret: string;
  onReady: (setupIntentId: string) => void;
  disabled?: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const result = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardElement },
    });

    setSubmitting(false);
    if (result.error) {
      setError(errorMessage("card_verification_failed", result.error.message));
      return;
    }
    if (result.setupIntent?.status === "succeeded") {
      setConfirmed(true);
      onReady(result.setupIntent.id);
    } else {
      setError(errorMessage("card_verification_failed"));
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-stone-300 px-3 py-3">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      <ErrorBanner message={error} />
      {confirmed ? (
        <p className="text-sm font-medium text-emerald-700">Card verified ✓</p>
      ) : (
        <PrimaryButton onClick={handleConfirm} disabled={!stripe || submitting || disabled}>
          {submitting ? "Verifying card…" : "Verify card"}
        </PrimaryButton>
      )}
    </div>
  );
}

export default function StripeCardForm({
  clientSecret,
  onReady,
  disabled,
}: {
  clientSecret: string | null;
  onReady: (setupIntentId: string) => void;
  disabled?: boolean;
}) {
  if (!stripePromise) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-500">
        Stripe is not configured in this environment (missing publishable key).
      </div>
    );
  }
  if (!clientSecret) return null;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <InnerForm clientSecret={clientSecret} onReady={onReady} disabled={disabled} />
    </Elements>
  );
}
