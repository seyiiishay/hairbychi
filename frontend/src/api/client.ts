import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "./types";

const normalizeApiBaseUrl = (value: string) => value.replace(/\/+$/, "").replace(/\/api$/, "");

// Accept either the raw host (recommended) or a full /api URL, but never duplicate /api.
export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
);

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 20000,
  withCredentials: true,
});

const ADMIN_TOKEN_KEY = "bbc_admin_session_token";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

apiClient.interceptors.request.use((config) => {
  if (config.url?.startsWith("/admin")) {
    const token = getAdminToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export class ApiRequestError extends Error {
  code: string;
  fields?: Record<string, unknown>;

  constructor(code: string, message: string, fields?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.fields = fields;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401 && error.config?.url?.startsWith("/admin")) {
      setAdminToken(null);
    }

    if (error.code === "ERR_NETWORK") {
      const message =
        error.config?.baseURL && error.config.baseURL.includes("railway")
          ? "The request was blocked by CORS or network policy. Check the Railway backend CORS settings and the VITE_API_BASE_URL value."
          : "Couldn't reach the server. Please try again.";

      return Promise.reject(new ApiRequestError("network_error", message));
    }

    const body = error.response?.data;
    if (body?.error) {
      return Promise.reject(new ApiRequestError(body.error.code, body.error.message, body.error.fields));
    }
    return Promise.reject(new ApiRequestError("network_error", "Couldn't reach the server. Please try again."));
  }
);
