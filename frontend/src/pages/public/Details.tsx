import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { ErrorBanner, PrimaryButton, SecondaryButton, WizardSteps } from "../../components/Shared";

export default function Details() {
  const { guestDetails, setGuestDetails, policyAcknowledged, setPolicyAcknowledged, selectedSlotStart, items } =
    useCart();
  const navigate = useNavigate();
  const [name, setName] = useState(guestDetails?.name || "");
  const [email, setEmail] = useState(guestDetails?.email || "");
  const [phone, setPhone] = useState(guestDetails?.phone || "");
  const [acknowledged, setAcknowledged] = useState(policyAcknowledged);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0 || !selectedSlotStart) {
    // <Navigate> (not an imperative navigate() call) so the redirect also
    // works on a hard/direct page load, not just when arriving via
    // client-side navigation from a previous step.
    return <Navigate to="/book" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in your name, email, and phone number.");
      return;
    }
    if (!acknowledged) {
      setError("Please agree to the Terms & Cancellation Policy to continue.");
      return;
    }
    setGuestDetails({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    setPolicyAcknowledged(true);
    navigate("/book/payment");
  };

  return (
    <div className="space-y-6">
      <WizardSteps current={3} />
      <h1 className="text-2xl font-semibold text-stone-900">Your details</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Full name</label>
          <input
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
          <input
            type="email"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Phone</label>
          <input
            type="tel"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            className="mt-1"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <span>
            I agree to the{" "}
            <Link to="/terms" target="_blank" className="text-brand-600 underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/cancellation-policy" target="_blank" className="text-brand-600 underline">
              Cancellation Policy
            </Link>
            .
          </span>
        </label>

        <ErrorBanner message={error} />

        <div className="flex justify-between pt-2">
          <SecondaryButton onClick={() => navigate("/book/slots")}>Back</SecondaryButton>
          <PrimaryButton type="submit">Continue to payment</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
