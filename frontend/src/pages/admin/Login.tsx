import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin, adminLoginBackupCode } from "../../api/endpoints";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { ApiRequestError } from "../../api/client";
import { errorMessage } from "../../lib/errors";
import { Card, ErrorBanner, PrimaryButton } from "../../components/Shared";

const APP_ENV = import.meta.env.VITE_APP_ENV || "development";

export default function Login() {
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = mode === "totp" ? await adminLogin(code) : await adminLoginBackupCode(code);
      login(res.session_token);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof ApiRequestError ? errorMessage(err.code, err.message) : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm">
        {APP_ENV === "staging" && (
          <div className="mb-4 rounded-lg bg-amber-500 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-white">
            STAGING — not live
          </div>
        )}
        <Card>
          <h1 className="mb-1 text-xl font-semibold text-stone-900">Stylist login</h1>
          <p className="mb-6 text-sm text-stone-500">BraidsByChi Admin</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {mode === "totp" ? "Authenticator code" : "Backup code"}
              </label>
              <input
                autoFocus
                inputMode={mode === "totp" ? "numeric" : "text"}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 tracking-widest focus:border-brand-500 focus:outline-none"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={mode === "totp" ? "123456" : "XXXX-XXXX"}
                required
              />
            </div>
            <ErrorBanner message={error} />
            <PrimaryButton type="submit" disabled={submitting} className="w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </PrimaryButton>
          </form>

          <button
            className="mt-4 text-sm text-stone-500 underline hover:text-brand-600"
            onClick={() => {
              setMode(mode === "totp" ? "backup" : "totp");
              setCode("");
              setError(null);
            }}
          >
            {mode === "totp" ? "Use a backup code instead" : "Use my authenticator app instead"}
          </button>
        </Card>
      </div>
    </div>
  );
}
