import { apiClient } from "./client";
import type {
  Paginated,
  Category,
  SlotsResponse,
  BookingCreatePayload,
  BookingCreateResponse,
  PrecheckResponse,
  GuestBooking,
  AdminBookingListItem,
  AdminBookingDetail,
  AvailabilityRecurringRule,
  AvailabilityBlock,
  Client,
  AvailabilityException,
} from "./types";

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------
export const getCategories = () => apiClient.get<Paginated<Category>>("/categories").then((r) => r.data);

export const getSlots = (date_from: string, date_to: string, required_duration_minutes: number) =>
  apiClient
    .post<SlotsResponse>("/availability/slots", { date_from, date_to, required_duration_minutes })
    .then((r) => r.data);

export const precheckBooking = (service_ids: string[], email: string, phone: string) =>
  apiClient.post<PrecheckResponse>("/bookings/precheck", { service_ids, email, phone }).then((r) => r.data);

export const createBooking = (payload: BookingCreatePayload) =>
  apiClient.post<BookingCreateResponse>("/bookings", payload).then((r) => r.data);

export const getBookingByToken = (token: string) =>
  apiClient.get<GuestBooking>(`/bookings/${token}`).then((r) => r.data);

export const cancelBookingByToken = (token: string) =>
  apiClient.post<GuestBooking>(`/bookings/${token}/cancel`).then((r) => r.data);

export const rescheduleBookingByToken = (token: string, new_start_time: string) =>
  apiClient.post<GuestBooking>(`/bookings/${token}/reschedule`, { new_start_time }).then((r) => r.data);

export const createSetupIntent = () =>
  apiClient.post<{ client_secret: string; setup_intent_id: string }>("/payments/setup-intent").then((r) => r.data);

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export const adminLogin = (totp_code: string) =>
  apiClient.post<{ session_token: string; expires_at: string }>("/admin/login", { totp_code }).then((r) => r.data);

export const adminLoginBackupCode = (backup_code: string) =>
  apiClient
    .post<{ session_token: string; expires_at: string }>("/admin/login/backup-code", { backup_code })
    .then((r) => r.data);

// The backend currently exposes admin login only; session/logout are not implemented.
// Keep local auth state in browser storage instead of hitting non-existent endpoints.
export const adminLogout = () => Promise.resolve();

export const adminSessionCheck = () =>
  Promise.resolve({ username: "admin", expires_at: new Date().toISOString() });

export interface AdminBookingListParams {
  status?: string;
  include_archived?: boolean;
  page?: number;
}

export const adminListBookings = (params: AdminBookingListParams = {}) =>
  apiClient
    .get<Paginated<AdminBookingListItem>>("/admin/bookings", {
      params: { ...params, include_archived: params.include_archived ?? false },
    })
    .then((r) => r.data);

export const adminGetBooking = (id: string) =>
  apiClient.get<AdminBookingDetail>(`/admin/bookings/${id}`).then((r) => r.data);

export const adminApproveBooking = (id: string, body?: { proof_url?: string; proof_note?: string }) =>
  apiClient.post<AdminBookingDetail>(`/admin/bookings/${id}/approve`, body || {}).then((r) => r.data);

export const adminDeclineBooking = (id: string, reason?: string) =>
  apiClient.post<AdminBookingDetail>(`/admin/bookings/${id}/decline`, { reason }).then((r) => r.data);

export const adminBatchBookings = (booking_ids: string[], action: "approve" | "decline" | "archive") =>
  apiClient
    .post<{ results: { id: string; success: boolean; error?: string }[] }>("/admin/bookings/batch", {
      booking_ids,
      action,
    })
    .then((r) => r.data);

export const adminMarkArrival = (id: string, arrival_status: "arrived" | "no_show", note?: string) =>
  apiClient.post<AdminBookingDetail>(`/admin/bookings/${id}/arrival`, { arrival_status, note }).then((r) => r.data);

export const adminManualOverride = (id: string, note: string) =>
  apiClient.post<AdminBookingDetail>(`/admin/bookings/${id}/manual-override`, { note }).then((r) => r.data);

export const adminResolveCancel = (id: string) =>
  apiClient.post<AdminBookingDetail>(`/admin/bookings/${id}/resolve-cancel`).then((r) => r.data);

export const adminResolveReschedule = (id: string, new_start_time: string) =>
  apiClient
    .post<AdminBookingDetail>(`/admin/bookings/${id}/resolve-reschedule`, { new_start_time })
    .then((r) => r.data);

export const adminListAvailabilityExceptions = () =>
  apiClient.get<AvailabilityException[]>("/admin/availability/exceptions").then((r) => r.data);

export const adminUploadProof = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return apiClient
    .post<{ proof_url: string }>("/admin/uploads/proof", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const adminListRecurringAvailability = () =>
  apiClient.get<AvailabilityRecurringRule[]>("/admin/availability/recurring").then((r) => r.data);

export const adminBulkSetRecurringAvailability = (rules: AvailabilityRecurringRule[]) =>
  apiClient.put<AvailabilityRecurringRule[]>("/admin/availability/recurring/bulk", rules).then((r) => r.data);

export const adminBlockDay = (date: string, reason?: string) =>
  apiClient
    .post<AvailabilityBlock & { conflicts: AdminBookingListItem[] }>("/admin/availability/block", { date, reason })
    .then((r) => r.data);

export const adminListResolutionQueue = () =>
  apiClient.get<Paginated<AdminBookingListItem>>("/admin/availability/resolution-queue").then((r) => r.data);

export const adminListCategories = () => apiClient.get<Paginated<Category>>("/admin/categories").then((r) => r.data);

export const adminCreateCategory = (data: { name: string; display_order?: number; is_active?: boolean }) =>
  apiClient.post("/admin/categories", data).then((r) => r.data);

export const adminUpdateCategory = (id: string, data: Partial<{ name: string; display_order: number; is_active: boolean }>) =>
  apiClient.patch(`/admin/categories/${id}`, data).then((r) => r.data);

export const adminDeleteCategory = (id: string) => apiClient.delete(`/admin/categories/${id}`);

export interface AdminService {
  id: string;
  category: string;
  name: string;
  description: string;
  photo_url: string;
  price: string;
  duration_minutes: number;
  display_order: number;
  is_active: boolean;
}

export const adminListServices = () => apiClient.get<Paginated<AdminService>>("/admin/services").then((r) => r.data);

export const adminCreateService = (data: Omit<AdminService, "id">) =>
  apiClient.post<AdminService>("/admin/services", data).then((r) => r.data);

export const adminUpdateService = (id: string, data: Partial<Omit<AdminService, "id">>) =>
  apiClient.patch<AdminService>(`/admin/services/${id}`, data).then((r) => r.data);

export const adminDeleteService = (id: string) => apiClient.delete(`/admin/services/${id}`);

export const adminGetClient = (id: string) => apiClient.get<Client>(`/admin/clients/${id}`).then((r) => r.data);

export const adminClearHighRisk = (id: string, note?: string) =>
  apiClient.post<Client>(`/admin/clients/${id}/clear-high-risk`, { note }).then((r) => r.data);
