function PolicyShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="prose prose-stone max-w-none space-y-4">
      <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
      {children}
    </div>
  );
}

// NOTE: Exact legal copy was not part of the uploaded product docs. These
// pages summarize the policy decisions that ARE locked in the PRD
// (Sections 8.1–8.4) so the booking checkbox has something real to link to.
// Replace with the client's final, lawyer-reviewed text before launch.

export function Terms() {
  return (
    <PolicyShell title="Terms of Service">
      <p>
        BraidsByChi accepts booking requests only — submitting a request does not guarantee an appointment. Every
        request is reviewed by the stylist and is either approved or declined before any appointment is confirmed.
      </p>
      <p>
        For online payments, your card is verified and securely saved at the time you submit a request; you are not
        charged until your request is approved. For offline payments, you arrange payment directly with the stylist,
        who confirms receipt before approving your request.
      </p>
    </PolicyShell>
  );
}

export function Privacy() {
  return (
    <PolicyShell title="Privacy Policy">
      <p>
        We collect the name, email, and phone number you provide to manage your booking, and use it only to
        communicate about your appointment(s). We never sell your information.
      </p>
      <p>
        Payment details are handled directly by Stripe and are never stored on our servers. Booking history is kept
        for record-keeping and dispute resolution.
      </p>
    </PolicyShell>
  );
}

export function CancellationPolicy() {
  return (
    <PolicyShell title="Cancellation Policy">
      <ul className="list-disc space-y-2 pl-5">
        <li>You may cancel or reschedule your booking once, for free, using the link in your confirmation email.</li>
        <li>
          Cancelling or rescheduling at least 24 hours before your appointment does not count against your account.
        </li>
        <li>
          A no-show or a cancellation made less than 24 hours before your appointment counts as a strike, and any
          deposit or payment already made is forfeited.
        </li>
        <li>
          After a second strike, future bookings require full payment upfront before your request can be submitted.
        </li>
        <li>Arriving within 15 minutes of your appointment time is not treated as a no-show.</li>
        <li>
          Refunds are only issued when the stylist needs to cancel or reschedule your appointment — never for
          client-initiated cancellations.
        </li>
      </ul>
    </PolicyShell>
  );
}
