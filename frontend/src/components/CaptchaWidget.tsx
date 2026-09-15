import { useEffect, useRef, useState } from "react";

const SITE_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY as string | undefined;
const PROVIDER = (import.meta.env.VITE_CAPTCHA_PROVIDER as string | undefined) || "hcaptcha";

const SCRIPT_SRC =
  PROVIDER === "turnstile"
    ? "https://challenges.cloudflare.com/turnstile/v0/api.js"
    : "https://js.hcaptcha.com/1/api.js";

declare global {
  interface Window {
    hcaptcha?: { render: (el: HTMLElement, opts: Record<string, unknown>) => void };
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => void };
  }
}

/**
 * Renders the configured CAPTCHA widget (BK-04) and reports the resulting
 * token via onVerify. With no VITE_CAPTCHA_SITE_KEY configured (local dev
 * against a backend running with CAPTCHA_BYPASS=True), renders a clearly
 * labelled stand-in instead of loading third-party scripts.
 */
export default function CaptchaWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) return;

    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!SITE_KEY || !loaded || !containerRef.current) return;
    const api = PROVIDER === "turnstile" ? window.turnstile : window.hcaptcha;
    if (api) {
      api.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onVerify(token),
      });
    }
  }, [loaded]);

  if (!SITE_KEY) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-500">
        CAPTCHA disabled in this environment (no site key configured).
        <button
          type="button"
          className="ml-2 text-brand-600 underline"
          onClick={() => onVerify("dev-bypass-token")}
        >
          Continue
        </button>
      </div>
    );
  }

  return <div ref={containerRef} />;
}
