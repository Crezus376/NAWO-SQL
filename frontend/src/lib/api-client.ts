export type ApiUser = {
  id: string;
  email: string;
  full_name?: string | null;
  email_verified: boolean;
  roles: string[];
  is_admin: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED";
const listeners = new Set<(event: AuthEvent, session: { user: ApiUser } | null) => void>();
let currentUser: ApiUser | null | undefined;

function baseUrl() {
  if (typeof window !== "undefined") return "";
  return process.env["API_URL"] ?? "http://127.0.0.1:8000";
}

async function csrf() {
  if (typeof window !== "undefined")
    await fetch(`${baseUrl()}/sanctum/csrf-cookie`, { credentials: "include" });
}

function xsrfToken() {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
    ?.split("=")
    .slice(1)
    .join("=");
  return value ? decodeURIComponent(value) : null;
}

export async function apiRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) await csrf();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  const token = xsrfToken();
  if (token && !["GET", "HEAD", "OPTIONS"].includes(method)) headers.set("X-XSRF-TOKEN", token);
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(`${baseUrl()}${path}`, { ...init, headers, credentials: "include" });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validation = payload.errors ? Object.values(payload.errors).flat().join(" ") : "";
    throw new ApiError(
      validation || payload.message || `Erreur HTTP ${response.status}`,
      response.status,
      payload.code,
    );
  }
  return payload.data as T;
}

export const apiAuth = {
  async me() {
    if (currentUser !== undefined) return currentUser;
    try {
      currentUser = await apiRequest<ApiUser>("/api/auth/user");
    } catch {
      currentUser = null;
    }
    return currentUser;
  },
  async login(email: string, password: string) {
    const user = await apiRequest<ApiUser>("/api/auth/sessions", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    currentUser = user;
    listeners.forEach((listener) => listener("SIGNED_IN", { user }));
    return user;
  },
  register(email: string, password: string) {
    return apiRequest<ApiUser>("/api/auth/users", {
      method: "POST",
      body: JSON.stringify({ email, password, password_confirmation: password }),
    });
  },
  resendVerification(email: string) {
    return apiRequest<{ sent: boolean }>("/api/auth/email-verification-notifications", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  forgotPassword(email: string) {
    return apiRequest<{ sent: boolean }>("/api/auth/password-reset-links", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  resetPassword(values: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    return apiRequest<{ reset: boolean }>("/api/auth/password-resets", {
      method: "POST",
      body: JSON.stringify(values),
    });
  },
  async logout() {
    await apiRequest("/api/auth/session", { method: "DELETE" });
    currentUser = null;
    listeners.forEach((listener) => listener("SIGNED_OUT", null));
  },
  async updateProfile(values: { full_name: string | null }) {
    const user = await apiRequest<ApiUser>("/api/auth/user", {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    currentUser = user;
    listeners.forEach((listener) => listener("USER_UPDATED", { user }));
    return user;
  },
  updatePassword(values: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) {
    return apiRequest<{ updated: boolean }>("/api/auth/user/password", {
      method: "PATCH",
      body: JSON.stringify(values),
    });
  },
  onChange(listener: (event: AuthEvent, session: { user: ApiUser } | null) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  clearCache() {
    currentUser = undefined;
  },
};
