// Shared types mirroring the Django REST API contract. Keep in sync with
// backend/bookings/serializers.py, catalog/serializers.py, etc.

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  photo_url: string;
  price: string; // decimal string, e.g. "180.00"
  duration_minutes: number;
}

export interface Category {
  id: string;
  name: string;
  display_order: number;
  services: Service[];
}

export type PaymentMethod = "online" | "offline";

export type BookingStatus =
  | "pending"
  | "approved"
  | "declined"
  | "cancelled"
  | "expired"
  | "payment_failed"
  | "manually_approved";

export type ArrivalStatus = "none" | "arrived" | "no_show";

export interface Slot {
  start: string; // ISO 8601 UTC
  service_end_time: string; // ISO 8601 UTC
}

export interface SlotsResponse {
  slots: Slot[];
}

export interface ClientInput {
  name: string;
  email: string;
  phone: string;
}

export interface BookingCreatePayload {
  client: ClientInput;
  service_ids: string[];
  requested_start_time: string;
  payment_method: PaymentMethod;
  policy_acknowledged: boolean;
  captcha_token: string;
  stripe_setup_intent_id?: string;
}

export interface BookingCreateResponse {
  id: string;
  status: BookingStatus;
  service_end_time: string;
  amount_due_today: string;
  deposit_amount: string;
  full_payment_required: boolean;
  strike_warning: boolean;
  manage_token: string;
}

export interface PrecheckResponse {
  total_price: number;
  deposit_amount: number;
  full_payment_required: boolean;
  amount_due_today: number;
  strike_warning: boolean;
}

export interface BookingItem {
  name_snapshot: string;
  price_snapshot: string;
  duration_snapshot: number;
}

export interface GuestBooking {
  id: string;
  status: BookingStatus;
  requested_start_time: string;
  service_end_time: string;
  payment_method: PaymentMethod;
  total_price: string;
  deposit_amount: string;
  amount_due_today: string;
  full_payment_required: boolean;
  reschedule_count: number;
  items: BookingItem[];
  client_name: string;
}

export interface AdminBookingListItem {
  id: string;
  status: BookingStatus;
  requested_start_time: string;
  service_end_time: string;
  calendar_blocked_until: string;
  payment_method: PaymentMethod;
  total_price: string;
  deposit_amount: string;
  amount_due_today: string;
  full_payment_required: boolean;
  conflict_flag: boolean;
  needs_resolution: boolean;
  arrival_status: ArrivalStatus;
  archived: boolean;
  client_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
}

export interface AdminBookingDetail extends AdminBookingListItem {
  items: BookingItem[];
  proof_url: string;
  proof_note: string;
  decline_reason: string;
  manual_override_note: string;
  arrival_note: string;
  reschedule_count: number;
  manage_token: string;
  created_at: string;
}

export interface AvailabilityRecurringRule {
  id?: number;
  weekday: number; // 0=Monday .. 6=Sunday
  start_time: string; // "HH:MM:SS" or "HH:MM"
  end_time: string;
  is_active?: boolean;
}

export interface AvailabilityBlock {
  id: number;
  date: string;
  reason: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  strike_count: number;
  reschedule_count_lifetime: number;
  high_risk_flag: boolean;
  high_risk_cleared_note: string;
  created_at: string;
  bookings?: AdminBookingListItem[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, unknown>;
  };
}
