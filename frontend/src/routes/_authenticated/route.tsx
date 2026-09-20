import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { apiAuth } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await apiAuth.me();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  component: () => <Outlet />,
});
