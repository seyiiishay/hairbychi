import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthError, DEMO_ADMIN, DEMO_CUSTOMER, register, signIn } from "../../store/store";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/form";
import Logo from "../../ui/Logo";
import Photo from "../../ui/Photo";

function Shell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Photo path="auth" art="wig" tone="gold" alt="" className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent" aria-hidden />
        <p className="absolute right-12 bottom-12 left-12 font-display text-5xl leading-tight text-ivory">
          Your next favourite hairstyle <em className="text-gold">starts here.</em>
        </p>
      </div>
      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-md">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-5xl">{title}</h1>
          <p className="mt-2 text-muted">{sub}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, label = "Password", autoComplete }: { value: string; onChange: (v: string) => void; label?: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input label={label} type={show ? "text" : "password"} required minLength={8} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 bottom-1.5 grid size-9 place-items-center rounded-lg text-muted hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function SignIn({ studio }: { studio?: boolean }) {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const demo = studio ? DEMO_ADMIN : DEMO_CUSTOMER;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      try {
        const user = signIn(email, password);
        if (studio && user.role !== "admin") throw new AuthError("This account doesn't have studio access.");
        nav(params.get("next") ?? (user.role === "admin" ? "/studio" : "/account"), { replace: true });
      } catch (err) {
        setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
        setLoading(false);
      }
    }, 500);
  };

  return (
    <Shell title={studio ? "Studio sign in" : "Welcome back"} sub={studio ? "Staff and owner access to the Hair by Chi dashboard." : "Sign in to manage bookings, saved looks and rewards."}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        {error ? (
          <p className="rounded-xl bg-error-soft p-3 text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-semibold underline decoration-gold underline-offset-4">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={loading}>
          Sign In
        </Button>
      </form>
      <div className="mt-6 rounded-2xl bg-cream p-4 text-sm ring-1 ring-line">
        <p className="font-semibold">Demo account</p>
        <p className="mt-1 text-muted">
          {demo.email} · {demo.password}
        </p>
        <button
          type="button"
          onClick={() => {
            setEmail(demo.email);
            setPassword(demo.password);
          }}
          className="mt-2 font-semibold underline decoration-gold underline-offset-4"
        >
          Fill in demo details
        </button>
      </div>
      {!studio ? (
        <p className="mt-8 text-center text-sm text-muted">
          New here?{" "}
          <Link to={`/register${params.get("next") ? `?next=${params.get("next")}` : ""}`} className="font-semibold text-ink underline decoration-gold underline-offset-4">
            Create an account
          </Link>
        </p>
      ) : null}
    </Shell>
  );
}

export function Register() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [f, setF] = useState({ firstName: "", lastName: "", email: params.get("email") ?? "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      try {
        register(f);
        nav(params.get("next") ?? "/account", { replace: true });
      } catch (err) {
        setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
        setLoading(false);
      }
    }, 500);
  };
  return (
    <Shell title="Create your account" sub="Book faster, save looks you love and earn Beauty Rewards on every visit.">
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        <Input label="First name" required autoComplete="given-name" value={f.firstName} onChange={set("firstName")} />
        <Input label="Last name" required autoComplete="family-name" value={f.lastName} onChange={set("lastName")} />
        <Input label="Email" type="email" required autoComplete="email" value={f.email} onChange={set("email")} className="sm:col-span-2" hint="Existing bookings made with this email will appear in your account." />
        <Input label="Phone" type="tel" required autoComplete="tel" value={f.phone} onChange={set("phone")} className="sm:col-span-2" />
        <div className="sm:col-span-2">
          <PasswordInput value={f.password} onChange={(password) => setF({ ...f, password })} autoComplete="new-password" />
          <p className="mt-1.5 text-xs text-muted">At least 8 characters.</p>
        </div>
        {error ? (
          <p className="rounded-xl bg-error-soft p-3 text-sm text-error sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" loading={loading} className="sm:col-span-2">
          Create Account
        </Button>
        <p className="text-xs text-muted sm:col-span-2">
          We'll send a verification link to confirm your email. By creating an account you agree to our <Link to="/policies#terms" className="underline">terms</Link> and{" "}
          <Link to="/policies#privacy" className="underline">privacy policy</Link>.
        </p>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link to="/signin" className="font-semibold text-ink underline decoration-gold underline-offset-4">
          Sign in
        </Link>
      </p>
    </Shell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <Shell title="Reset your password" sub="Enter your email and we'll send you a secure reset link.">
      {sent ? (
        <p className="rounded-2xl bg-success-soft p-5 text-sm text-success" role="status">
          If an account exists for {email}, a reset link is on its way. It expires in 30 minutes.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="flex flex-col gap-5"
        >
          <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" size="lg">
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-8 text-center text-sm">
        <Link to="/signin" className="font-semibold underline decoration-gold underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </Shell>
  );
}
