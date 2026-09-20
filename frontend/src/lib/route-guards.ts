import { redirect } from "@tanstack/react-router";

import { apiAuth } from "@/lib/api-client";

export async function redirectAuthenticatedUser() {
  const user = await apiAuth.me();

  if (import.meta.env.DEV) {
    console.debug("[auth-guard] route publique", {
      authenticated: Boolean(user),
    });
  }

  if (user) {
    if (import.meta.env.DEV) console.debug("[auth-guard] redirection vers /dashboard");
    throw redirect({ to: "/dashboard" });
  }
}
