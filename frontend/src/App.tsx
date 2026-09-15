import { Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import AdminLayout from "./components/AdminLayout";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

import Browse from "./pages/public/Browse";
import Cart from "./pages/public/Cart";
import Slots from "./pages/public/Slots";
import Details from "./pages/public/Details";
import Payment from "./pages/public/Payment";
import Confirm from "./pages/public/Confirm";
import Manage from "./pages/public/Manage";
import { Terms, Privacy, CancellationPolicy } from "./pages/public/PolicyPages";

import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import BookingDetail from "./pages/admin/BookingDetail";
import Availability from "./pages/admin/Availability";
import Services from "./pages/admin/Services";
import ClientDetail from "./pages/admin/ClientDetail";

function NotFound() {
  return <p className="text-stone-500">Page not found.</p>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Browse />} />
        <Route path="/book/cart" element={<Cart />} />
        <Route path="/book/slots" element={<Slots />} />
        <Route path="/book/details" element={<Details />} />
        <Route path="/book/payment" element={<Payment />} />
        <Route path="/book/confirm" element={<Confirm />} />
        <Route path="/manage/:token" element={<Manage />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cancellation-policy" element={<CancellationPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="availability" element={<Availability />} />
        <Route path="services" element={<Services />} />
        <Route path="clients/:id" element={<ClientDetail />} />
      </Route>
    </Routes>
  );
}
