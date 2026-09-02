import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2 } from "lucide-react";
import { PublicShell } from "@/components/nawo/public-shell";
import { TicketVisual } from "@/components/nawo/ticket-visual";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getTicket } from "@/lib/nawo.functions";
import { formatDate } from "@/lib/nawo";

export const Route = createFileRoute("/ticket/$id")({
  head: () => ({
    meta: [
      { title: "Mon billet — NAWO" },
      {
        name: "description",
        content: "Votre billet NAWO avec QR code unique, à présenter à l'entrée de l'événement.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Mon billet — NAWO" },
      { property: "og:description", content: "Billet NAWO avec QR code unique." },
    ],
  }),
  component: TicketPage,
});

function TicketPage() {
  const { id } = Route.useParams();
  const fetchTicket = useServerFn(getTicket);

  const { data, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => fetchTicket({ data: { ticketId: id } }),
  });

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-xl px-5 py-10">
        {isLoading ? (
          <Skeleton className="h-80 w-full rounded-2xl" />
        ) : !data?.ticket ? (
          <div className="card-surface p-10 text-center">
            <h1 className="text-xl font-extrabold">Billet introuvable</h1>
            <p className="mt-2 text-sm text-muted-foreground">Ce lien de billet n'est pas valide.</p>
            <Button className="mt-6" asChild>
              <Link to="/events">Voir les événements</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="size-6" />
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight">Votre billet est prêt</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Présentez ce QR code à l'entrée. Il est utilisable une seule fois.
              </p>
            </div>

            <TicketVisual
              qrToken={data.ticket.qr_token}
              ticketNumber={data.ticket.ticket_number}
              holder={`${data.ticket.holder_first_name} ${data.ticket.holder_last_name}`}
              eventName={data.event?.name ?? "Événement"}
              eventDate={data.event?.event_date}
              eventTime={data.event?.event_time}
              location={data.event?.location}
              ticketTypeName={data.ticketType?.name ?? "Billet"}
              template={data.template}
              fallbackImage={data.ticketType?.image_url ?? data.event?.cover_image_url ?? null}
            />

            {data.sessions?.length ? (
              <div className="card-surface mt-5 space-y-2 p-4">
                <p className="text-sm font-bold">Journées incluses</p>
                {data.sessions.map((entry) => (
                  <div
                    key={entry.accessId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>
                      {entry.session?.name}
                      <span className="text-muted-foreground">
                        {" · "}
                        {entry.session
                          ? formatDate(entry.session.session_date, entry.session.start_time)
                          : null}
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        entry.isUsed
                          ? "bg-destructive/10 text-destructive"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {entry.isUsed ? "Déjà scanné" : "Valide"}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Conservez ce lien : c'est votre billet. Chaque journée se scanne une seule fois.
            </p>
          </>
        )}
      </div>
    </PublicShell>
  );
}
