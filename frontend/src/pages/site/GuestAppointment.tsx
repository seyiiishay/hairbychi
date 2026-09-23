import { useState, type FormEvent } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useStore } from "../../store/store";
import AppointmentView from "../../ui/AppointmentView";
import { Button, ButtonLink } from "../../ui/Button";
import { Container, EmptyState } from "../../ui/bits";
import { Input } from "../../ui/form";

/** Manage a booking without an account: reference + matching email (as in the confirmation email link). */
export default function GuestAppointment() {
  const { ref } = useParams();
  const [params, setParams] = useSearchParams();
  const s = useStore();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const appt = s.appointments.find((a) => a.ref === ref?.toUpperCase());
  const verified = appt && params.get("email")?.toLowerCase() === appt.customer.email.toLowerCase();

  if (!appt) {
    return (
      <Container className="py-24">
        <EmptyState title="We couldn't find that booking." body="Double-check the reference in your confirmation email." action="Contact us" to="/contact" />
      </Container>
    );
  }

  if (!verified) {
    const submit = (e: FormEvent) => {
      e.preventDefault();
      if (email.trim().toLowerCase() === appt.customer.email.toLowerCase()) setParams({ email: email.trim() });
      else setError("That email doesn't match this booking.");
    };
    return (
      <Container className="max-w-md py-20">
        <h1 className="text-5xl">Manage your booking</h1>
        <p className="mt-2 text-muted">Confirm the email you booked with to view {appt.ref}.</p>
        <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <Button type="submit" size="lg">
            View appointment
          </Button>
        </form>
      </Container>
    );
  }

  return (
    <Container className="max-w-4xl py-12 md:py-16">
      <p className="eyebrow mb-3">Your appointment</p>
      <h1 className="mb-8 text-5xl">Hi {appt.customer.firstName}</h1>
      <AppointmentView appt={appt} />
      <div className="mt-10 rounded-[var(--radius-card)] bg-cream p-6 text-sm ring-1 ring-line">
        <p className="font-semibold">Keep everything in one place</p>
        <p className="mt-1 text-muted">Create a free account with {appt.customer.email} to see all your bookings, save looks and earn rewards.</p>
        <ButtonLink to={`/register?email=${encodeURIComponent(appt.customer.email)}`} size="sm" className="mt-4">
          Create account
        </ButtonLink>
      </div>
    </Container>
  );
}

export function NotFound() {
  return (
    <Container className="py-24">
      <EmptyState title="This page has moved on." body="The page you're looking for doesn't exist, but your next look does." action="Explore services" to="/services" />
    </Container>
  );
}
