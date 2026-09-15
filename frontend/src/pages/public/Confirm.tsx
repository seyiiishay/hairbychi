import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import type { BookingCreateResponse } from "../../api/types";
import { formatDateTime, money } from "../../lib/timezone";
import { Card, PrimaryButton } from "../../components/Shared";
import { useCart } from "../../context/CartContext";

export default function Confirm() {
  const location = useLocation();
  const booking = location.state as BookingCreateResponse | undefined;
  const { clear } = useCart();

  // Clear here (rather than in the Payment submit handler) so Payment's own
  // empty-cart guard never fires mid-navigation.
  useEffect(() => {
    if (booking) clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  if (!booking) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-stone-900">Check your email</h1>
        <p className="text-stone-500">
          If you just submitted a request, look for a confirmation email with a link to manage your booking.
        </p>
        <Link to="/">
          <PrimaryButton>Back to booking</PrimaryButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
        ✓
      </div>
      <h1 className="text-2xl font-semibold text-stone-900">Your request has been sent!</h1>
      <p className="text-stone-500">You'll receive an email once it's reviewed.</p>

      <Card className="mx-auto max-w-sm text-left">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-500">Appointment ends by</dt>
            <dd className="font-medium text-stone-900">{formatDateTime(booking.service_end_time)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-500">Amount due today</dt>
            <dd className="font-medium text-stone-900">{money(booking.amount_due_today)}</dd>
          </div>
        </dl>
      </Card>

      <Link to={`/manage/${booking.manage_token}`}>
        <PrimaryButton>Manage this booking</PrimaryButton>
      </Link>
    </div>
  );
}
