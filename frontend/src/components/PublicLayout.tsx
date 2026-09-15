import { Link, Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold text-brand-700">
            BraidsByChi
          </Link>
          <nav className="text-sm text-stone-500">
            <Link to="/book" className="hover:text-brand-600">
              Book now
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-3xl px-4 py-8 text-xs text-stone-400">
        <div className="flex flex-wrap gap-4">
          <Link to="/terms" className="hover:text-stone-600">
            Terms
          </Link>
          <Link to="/privacy" className="hover:text-stone-600">
            Privacy
          </Link>
          <Link to="/cancellation-policy" className="hover:text-stone-600">
            Cancellation Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
