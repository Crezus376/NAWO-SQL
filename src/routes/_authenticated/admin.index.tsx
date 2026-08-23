import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Receipt, Ticket, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/nawo";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Administration NAWO — Vue d'ensemble" },
      {
        name: "description",
        content: "Volume d'événements, de commandes et de recettes sur l'ensemble de la plateforme NAWO.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Administration NAWO" },
      { property: "og:description", content: "Pilotage global de la plateforme." },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [events, orders, tickets] = await Promise.all([
        supabase.from("events").select("id, status"),
        supabase.from("orders").select("id, amount, status"),
        supabase.from("tickets").select("id, is_used"),
      ]);
      return {
        events: events.data ?? [],
        orders: orders.data ?? [],
        tickets: tickets.data ?? [],
      };
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;

  const paid = (data?.orders ?? []).filter((o) => o.status === "paid");
  const revenue = paid.reduce((sum, o) => sum + Number(o.amount), 0);

  const stats = [
    { label: "Événements", value: String(data?.events.length ?? 0), icon: CalendarDays },
    { label: "Commandes payées", value: String(paid.length), icon: Receipt },
    { label: "Billets émis", value: String(data?.tickets.length ?? 0), icon: Ticket },
    { label: "Volume encaissé", value: formatPrice(revenue), icon: Wallet },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="card-surface p-5">
          <span className="bg-primary-soft mb-3 grid size-9 place-items-center rounded-lg text-primary">
            <s.icon className="size-4" />
          </span>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
          <p className="mt-1 text-xl font-extrabold tracking-tight">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
