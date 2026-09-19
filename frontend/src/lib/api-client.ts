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

type ApiResult<T = any[]> = { data: T; error: Error | null };
type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED";

const listeners = new Set<(event: AuthEvent, session: { user: ApiUser } | null) => void>();
let currentUser: ApiUser | null | undefined;

function baseUrl() {
  if (typeof window !== "undefined") return import.meta.env["VITE_API_URL"] ?? "";
  return process.env["VITE_API_URL"] ?? process.env["API_URL"] ?? "http://127.0.0.1:8000";
}

async function csrf() {
  if (typeof window !== "undefined") {
    await fetch(`${baseUrl()}/sanctum/csrf-cookie`, { credentials: "include" });
  }
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

export async function apiRequest<T = any>(path: string, init: RequestInit = {}): Promise<T> {
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
      currentUser = await apiRequest<ApiUser>("/api/auth/me");
    } catch {
      currentUser = null;
    }
    return currentUser;
  },
  async login(email: string, password: string) {
    const user = await apiRequest<ApiUser>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    currentUser = user;
    listeners.forEach((listener) => listener("SIGNED_IN", { user }));
    return user;
  },
  async resendVerification(email: string) {
    return apiRequest<{ sent: boolean }>("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async register(email: string, password: string) {
    const user = await apiRequest<ApiUser>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, password_confirmation: password }),
    });
    return user;
  },
  async logout() {
    await apiRequest("/api/auth/logout", { method: "POST" });
    currentUser = null;
    listeners.forEach((listener) => listener("SIGNED_OUT", null));
  },
  async updateProfile(values: { full_name: string | null }) {
    const user = await apiRequest<ApiUser>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    currentUser = user;
    listeners.forEach((listener) => listener("USER_UPDATED", { user }));
    return user;
  },
  async updatePassword(values: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) {
    return apiRequest<{ updated: boolean }>("/api/auth/password", {
      method: "POST",
      body: JSON.stringify(values),
    });
  },
  onChange(listener: (event: AuthEvent, session: { user: ApiUser } | null) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  clearCache() {
    currentUser = undefined;
  },
};

class QueryBuilder<T = any[]> implements PromiseLike<ApiResult<T>> {
  private filters = new URLSearchParams();
  private operation: "read" | "insert" | "update" | "delete" = "read";
  private values: any;
  constructor(private table: string) {}
  select(_columns = "*") {
    return this;
  }
  eq(column: string, value: unknown) {
    this.filters.append(`eq[${column}]`, String(value));
    return this;
  }
  in(column: string, values: unknown[]) {
    this.filters.append(`in[${column}]`, values.join(","));
    return this;
  }
  ilike(column: string, value: string) {
    this.filters.append(`ilike[${column}]`, value);
    return this;
  }
  order(column: string, options?: { ascending?: boolean }) {
    this.filters.set("order", `${column}:${options?.ascending === false ? "desc" : "asc"}`);
    return this;
  }
  limit(value: number) {
    this.filters.set("limit", String(value));
    return this;
  }
  insert(values: any) {
    this.operation = "insert";
    this.values = values;
    return this;
  }
  update(values: any) {
    this.operation = "update";
    this.values = values;
    return this;
  }
  delete() {
    this.operation = "delete";
    return this;
  }
  single() {
    this.filters.set("single", "1");
    return this as unknown as QueryBuilder<any>;
  }
  maybeSingle() {
    this.filters.set("single", "1");
    return this as unknown as QueryBuilder<any>;
  }
  then<TResult1 = ApiResult<T>, TResult2 = never>(
    onfulfilled?: ((value: ApiResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
  private async execute(): Promise<ApiResult<T>> {
    const query = this.filters.toString();
    const path = `/api/data/${this.table}${query ? `?${query}` : ""}`;
    const method =
      this.operation === "read"
        ? "GET"
        : this.operation === "insert"
          ? "POST"
          : this.operation === "update"
            ? "PUT"
            : "DELETE";
    const body =
      this.operation === "insert"
        ? this.values
        : this.operation === "update"
          ? { values: this.values }
          : undefined;
    try {
      return {
        data: await apiRequest<T>(path, {
          method,
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        }),
        error: null,
      };
    } catch (error) {
      return { data: null as T, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}

export const apiDb = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  auth: {
    async getUser() {
      const user = await apiAuth.me();
      return { data: { user }, error: user ? null : new Error("Non authentifié") };
    },
    async getSession() {
      const user = await apiAuth.me();
      return { data: { session: user ? { user } : null }, error: null };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        return { data: { user: await apiAuth.login(email, password) }, error: null };
      } catch (error) {
        return { data: null, error: error as Error };
      }
    },
    async signUp({ email, password }: { email: string; password: string; options?: unknown }) {
      try {
        return { data: { user: await apiAuth.register(email, password) }, error: null };
      } catch (error) {
        return { data: null, error: error as Error };
      }
    },
    async signOut() {
      try {
        await apiAuth.logout();
        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    async resendVerification(email: string) {
      try {
        await apiAuth.resendVerification(email);
        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    async resetPasswordForEmail(email: string, _options?: unknown) {
      try {
        await apiRequest("/api/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    onAuthStateChange(callback: (event: AuthEvent, session: { user: ApiUser } | null) => void) {
      const unsubscribe = apiAuth.onChange(callback);
      return { data: { subscription: { unsubscribe } } };
    },
  },
};

export async function uploadImage(bucket: "event-images" | "ticket-images", file: File) {
  const form = new FormData();
  form.append("file", file);
  const result = await apiRequest<{ path: string; url: string }>(`/api/uploads/${bucket}`, {
    method: "POST",
    body: form,
  });
  return result.url;
}

export async function uploadFile(bucket: "withdrawal-proofs", file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<{ path: string; url: string | null }>(`/api/uploads/${bucket}`, {
    method: "POST",
    body: form,
  });
}
