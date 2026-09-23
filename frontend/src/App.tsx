import { Suspense, lazy, type ComponentType } from "react";
import { Route, Routes } from "react-router-dom";
import SiteLayout from "./ui/SiteLayout";
import Home from "./pages/site/Home";
import Services from "./pages/site/Services";
import ServiceDetail from "./pages/site/ServiceDetail";
import Book from "./pages/site/Book";
import Confirmation from "./pages/site/Confirmation";
import Gallery from "./pages/site/Gallery";
import About from "./pages/site/About";
import { StylistProfile, Stylists } from "./pages/site/Stylists";
import Reviews from "./pages/site/Reviews";
import Contact from "./pages/site/Contact";
import { Faq, Policies } from "./pages/site/Info";
import FindMyStyle from "./pages/site/FindMyStyle";
import Inspiration from "./pages/site/Inspiration";
import { ForgotPassword, Register, SignIn } from "./pages/site/Auth";
import GuestAppointment, { NotFound } from "./pages/site/GuestAppointment";
import { AccountLayout, AppointmentDetail, Appointments, Overview, Payments, Profile, Saved } from "./pages/account/Account";

// The owner dashboard is its own chunk: clients never download it
const load = <T, K extends keyof T>(importer: () => Promise<T>, name: K) =>
  lazy(() => importer().then((m) => ({ default: m[name] as ComponentType })));
const StudioLayout = load(() => import("./pages/studio/StudioLayout"), "default");
const Dashboard = load(() => import("./pages/studio/Operations"), "Dashboard");
const AppointmentsAdmin = load(() => import("./pages/studio/Operations"), "AppointmentsAdmin");
const CalendarAdmin = load(() => import("./pages/studio/CalendarAdmin"), "default");
const ServicesAdmin = load(() => import("./pages/studio/Catalog"), "ServicesAdmin");
const StaffAdmin = load(() => import("./pages/studio/Catalog"), "StaffAdmin");
const GalleryAdmin = load(() => import("./pages/studio/Catalog"), "GalleryAdmin");
const DiscountsAdmin = load(() => import("./pages/studio/Catalog"), "DiscountsAdmin");
const CustomersAdmin = load(() => import("./pages/studio/People"), "CustomersAdmin");
const ReviewsAdmin = load(() => import("./pages/studio/People"), "ReviewsAdmin");
const Inbox = load(() => import("./pages/studio/People"), "Inbox");
const PaymentsAdmin = load(() => import("./pages/studio/Money"), "PaymentsAdmin");
const Reports = load(() => import("./pages/studio/Money"), "Reports");
const SettingsAdmin = load(() => import("./pages/studio/SettingsAdmin"), "default");

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/book" element={<Book />} />
        <Route path="/book/confirmed/:ref" element={<Confirmation />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/about" element={<About />} />
        <Route path="/stylists" element={<Stylists />} />
        <Route path="/stylists/:id" element={<StylistProfile />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/find-my-style" element={<FindMyStyle />} />
        <Route path="/inspiration" element={<Inspiration />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/studio/login" element={<SignIn studio />} />
        <Route path="/appointment/:ref" element={<GuestAppointment />} />
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<Overview />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="appointments/:ref" element={<AppointmentDetail />} />
          <Route path="saved" element={<Saved />} />
          <Route path="payments" element={<Payments />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/studio"
        element={
          <Suspense fallback={<div className="grid min-h-screen place-items-center bg-ink font-display text-2xl text-gold">Hair by Chi</div>}>
            <StudioLayout />
          </Suspense>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<CalendarAdmin />} />
        <Route path="appointments" element={<AppointmentsAdmin />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="customers" element={<CustomersAdmin />} />
        <Route path="services" element={<ServicesAdmin />} />
        <Route path="staff" element={<StaffAdmin />} />
        <Route path="payments" element={<PaymentsAdmin />} />
        <Route path="reviews" element={<ReviewsAdmin />} />
        <Route path="discounts" element={<DiscountsAdmin />} />
        <Route path="gallery" element={<GalleryAdmin />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<SettingsAdmin />} />
      </Route>
    </Routes>
  );
}
