import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { NawoLogo } from "@/components/nawo/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): { email?: string } =>
    typeof search["email"] === "string" ? { email: search["email"] } : {},
  head: () => ({
    meta: [
      { title: "Vérifiez votre email — NAWO" },
      {
        name: "description",
        content:
          "Confirmez votre adresse email pour activer pleinement votre compte organisateur NAWO.",
      },
      { property: "og:title", content: "Vérifiez votre email — NAWO" },
      { property: "og:description", content: "Confirmez votre adresse email NAWO." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = useSearch({ from: "/verify-email" });

  return (
    <div className="bg-brand-subtle flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <NawoLogo />
      <div className="card-surface mt-8 w-full max-w-sm p-6 text-center">
        <span className="bg-primary-soft mx-auto mb-4 grid size-12 place-items-center rounded-full text-primary">
          <MailCheck className="size-6" />
        </span>
        <h1 className="text-xl font-extrabold tracking-tight">Compte actif</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La vérification d'email est désactivée pour cette phase de test
          {email ? ` pour ${email}` : ""}.
        </p>
        <Button className="mt-3 w-full" asChild>
          <Link to="/dashboard">Ouvrir le tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
}
