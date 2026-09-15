import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const APP_ENV = import.meta.env.VITE_APP_ENV || "development";

const navItems = [
  { to: "/admin", label: "Bookings", end: true },
  { to: "/admin/availability", label: "Availability" },
  { to: "/admin/services", label: "Services" },
];

export default function AdminLayout() {
  const { logout, username } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-100">
      {APP_ENV === "staging" && (
        <div className="bg-amber-500 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-white">
          STAGING — not live
        </div>
      )}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold text-brand-700">BraidsByChi Admin</span>
          <nav className="flex items-center gap-4 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? "font-medium text-brand-700" : "text-stone-500 hover:text-brand-600"
                }
              >
                {item.label}
              </NavLink>
            ))}
            <span className="text-stone-300">|</span>
            <span className="text-stone-500">{username}</span>
            <button
              className="text-stone-500 hover:text-red-600"
              onClick={async () => {
                await logout();
                navigate("/admin/login");
              }}
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
