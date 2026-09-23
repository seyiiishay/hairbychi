export type ArtKey = "braids" | "locs" | "straight" | "curls" | "bun" | "wig" | "cornrows" | "short" | "twists";
export type Tone = "sand" | "rose" | "gold" | "cocoa" | "ivory" | "blush";

export type CategoryId =
  | "braids"
  | "natural"
  | "weaves"
  | "wigs"
  | "locs"
  | "treatments"
  | "kids"
  | "bridal"
  | "men"
  | "addons";

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  art: ArtKey;
  tone: Tone;
}

export type StyleGoal = "protective" | "natural" | "occasion" | "quick" | "low-maintenance";

export interface AddOn {
  id: string;
  name: string;
  price: number;
  minutes: number;
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  categoryId: CategoryId;
  tagline: string;
  description: string;
  price: number;
  /** price shown as "From $x" when the final cost depends on length/size */
  priceFrom: boolean;
  minutes: number;
  deposit: number;
  hairIncluded: boolean;
  suitableFor: string;
  includes: string[];
  prep: string;
  addOnIds: string[];
  stylistIds: string[];
  goals: StyleGoal[];
  /** complex services are booked as a consultation first */
  consultation: boolean;
  popular: boolean;
  active: boolean;
  art: ArtKey;
  tone: Tone;
  /** optional uploaded / hosted image; falls back to /images/services/<id>.jpg then art */
  image?: string;
}

export interface Stylist {
  id: string;
  name: string;
  title: string;
  rating: number;
  appointments: number;
  years: number;
  specialties: string[];
  bio: string;
  quote: string;
  /** 0 = Sunday … 6 = Saturday */
  workDays: number[];
  start: string;
  end: string;
  commission: number;
  active: boolean;
  art: ArtKey;
  tone: Tone;
  image?: string;
}

export interface Review {
  id: string;
  name: string;
  serviceId: string;
  stylistId: string;
  rating: number;
  text: string;
  date: string;
  withPhoto?: boolean;
  status: "published" | "pending" | "hidden";
  appointmentRef?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  label: GalleryLabel;
  serviceId: string;
  art: ArtKey;
  tone: Tone;
  shape: "tall" | "square" | "wide";
  image?: string;
}

export type GalleryLabel = "Braids" | "Wigs" | "Natural Hair" | "Locs" | "Silk Press" | "Colour" | "Bridal";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "checked-in"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

export interface BookingAnswers {
  length?: string;
  thickness?: string;
  currentStyle?: "yes" | "no";
  hairCondition?: string;
}

export interface Appointment {
  ref: string;
  serviceId: string;
  stylistId: string;
  addOnIds: string[];
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  minutes: number;
  status: AppointmentStatus;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  answers: BookingAnswers;
  notes: string;
  referenceImage?: string;
  subtotal: number;
  discount: number;
  discountCode?: string;
  total: number;
  deposit: number;
  paid: number;
  paymentType: "deposit" | "full";
  paymentMethod: "card" | "apple-pay" | "google-pay" | "in-salon";
  refunded?: number;
  createdAt: string;
  reviewed?: boolean;
  rescheduleCount: number;
  source: "online" | "admin";
}

export interface Block {
  id: string;
  /** null blocks the whole salon */
  stylistId: string | null;
  date: string;
  /** omitted = full day */
  start?: string;
  end?: string;
  reason: string;
}

export type WeekHours = Record<number, { open: string; close: string } | null>;

export interface SpecialHours {
  id: string;
  date: string;
  label: string;
  hours: { open: string; close: string } | null;
}

export interface Discount {
  code: string;
  description: string;
  type: "percent" | "amount";
  value: number;
  firstVisitOnly: boolean;
  active: boolean;
  uses: number;
}

export interface User {
  id: string;
  role: "customer" | "admin";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Demo-only credential check. A real deployment must authenticate server-side. */
  passwordHash: string;
  verified: boolean;
  preferences: { hairType?: string; favouriteStylistId?: string; notes?: string };
  points: number;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  serviceId: string;
  stylistId: string | null;
  date: string;
  timeRange: "morning" | "afternoon" | "evening" | "any";
  name: string;
  email: string;
  createdAt: string;
  notified: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface ConsultationRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  image?: string;
  preferredDate?: string;
  status: "new" | "approved" | "declined";
  createdAt: string;
}

export interface OutboxMessage {
  id: string;
  to: string;
  subject: string;
  kind: "confirmation" | "reminder-24h" | "reminder-2h" | "cancellation" | "reschedule" | "waitlist" | "review-request";
  sendAt: string;
  ref?: string;
}

export interface Settings {
  cancellationHours: number;
  lateMinutes: number;
  bufferMinutes: number;
  slotMinutes: number;
  leadHours: number;
  bookingWindowDays: number;
  allowFullPayment: boolean;
}
