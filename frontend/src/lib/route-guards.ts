import { redirect } from "@tanstack/react-router";

import { apiDb } from "@/lib/api-client";

export async function redirectAuthenticatedUser() {
  const { data, error } = await apiDb.auth.getUser();

  if (import.meta.env.DEV) {
    console.debug("[auth-guard] route publique", {
      authenticated: Boolean(data.user),
      error: error?.message ?? null,
    });
  }

  if (!error && data.user) {
    if (import.meta.env.DEV) console.debug("[auth-guard] redirection vers /dashboard");
    throw redirect({ to: "/dashboard" });
  }
}
