import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, QrCode, Sparkles, Ticket } from "lucide-react";
import { PublicShell } from "@/components/nawo/public-shell";
import { EventCard } from "@/components/nawo/event-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/nawo-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NAWO — Billetterie événementielle simple et élégante" },
      {
        name: "description",
        content:
          "Découvrez les événements NAWO et achetez votre billet en moins d'une minute. Organisateurs : créez, vendez et scannez vos billets simplement.",
      },
      { property: "og:title", content: "NAWO — Billetterie événementielle" },
      {
        property: "og:description",
        content: "Découvrez les événements et achetez votre billet en moins d'une minute.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["public-events", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, slug, event_date, event_time, location, cover_image_url")
        .in("status", ["published", "ongoing"])
        .order("event_date", { ascending: true })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <PublicShell>
      <section className="bg-brand-subtle relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="bg-primary-soft inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              Billetterie nouvelle génération
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Vos événements,
              <br />
              <span className="text-brand">vos billets</span>, simplement.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
              NAWO permet aux organisateurs de créer un événement en quelques minutes, et aux
              participants d'obtenir un billet avec QR code unique en quelques secondes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/events">
                  Voir les événements
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">Créer mon événement</Link>
              </Button>
            </div>
          </div>
          <div className="animate-in fade-in duration-1000">
            <img
              src={heroImage}
              alt="Illustration NAWO en dégradé violet et rose"
              width={1600}
              height={1104}
              className="w-full rounded-3xl shadow-glow"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Ticket, title: "Créez en 2 minutes", text: "Nom, date, lieu, affiche. C'est publié." },
            { icon: Sparkles, title: "Achat ultra rapide", text: "Pas de compte requis pour les participants." },
            { icon: QrCode, title: "Scan à l'entrée", text: "Un QR code unique, utilisable une seule fois." },
          ].map((item) => (
            <div key={item.title} className="card-surface p-5">
              <span className="bg-primary-soft mb-3 grid size-10 place-items-center rounded-xl text-primary">
                <item.icon className="size-5" />
              </span>
              <h3 className="font-bold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="events" className="mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Événements</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Les événements actuellement pris en charge par NAWO.
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/events">Tout voir</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="card-surface p-10 text-center">
            <p className="font-semibold">Aucun événement publié pour le moment.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vous organisez un événement ? Créez votre compte et publiez-le en quelques minutes.
            </p>
            <Button className="mt-5" asChild>
              <Link to="/register">Créer un compte organisateur</Link>
            </Button>
          </div>
        )}
      </section>
    </PublicShell>
  );
}
