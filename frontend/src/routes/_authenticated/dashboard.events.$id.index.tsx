import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Receipt, Ticket, Users, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { organizerApi } from "@/lib/api-domain";
import { formatPrice } from "@/lib/nawo";

export const Route = createFileRoute("/_authenticated/dashboard/events/$id/")({
  head: () => ({
    meta: [
      { title: "Aperçu de l'événement — NAWO" },
      {
        name: "description",
        content: "Ventes, recettes et dernières commandes de votre événement.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Aperçu de l'événement — NAWO" },
      { property: "og:description", content: "Ventes et recettes en temps réel." },
    ],
  }),
  component: EventOverview,
});

function EventOverview() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["event-stats", id],
    queryFn: async () => {
      return organizerApi.overview(id);
    },
  });

  const paid = data?.orders ?? [];
  const revenue = Number(data?.revenue ?? 0);

  const stats = [
    { label: "Recettes", value: formatPrice(revenue), icon: Wallet },
    { label: "Commandes payées", value: String(data?.orders_count ?? paid.length), icon: Receipt },
    { label: "Billets émis", value: String(data?.tickets_count ?? 0), icon: Ticket },
    { label: "Entrées validées", value: String(data?.used_tickets ?? 0), icon: Users },
  ];

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="space-y-8">
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

      <div className="card-surface overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-bold">Dernières commandes</h2>
        </div>
        {paid.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paid.slice(0, 15).map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.first_name} {order.last_name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {order.email}
                  </TableCell>
                  <TableCell>{formatPrice(order.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{order.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Aucune commande pour l'instant.
          </p>
        )}
      </div>
    </div>
  );
}
