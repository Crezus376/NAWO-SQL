import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { NawoLogo } from "@/components/nawo/logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Vérifiez votre email — NAWO" },
      {
        name: "description",
        content: "Confirmez votre adresse email pour activer pleinement votre compte organisateur NAWO.",
      },
      { property: "og:title", content: "Vérifiez votre email — NAWO" },
      { property: "og:description", content: "Confirmez votre adresse email NAWO." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = useSearch({ from: "/verify-email" });

  async function resend() {
    if (!email) return;
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) toast.error(error.message);
    else toast.success("Email de vérification renvoyé.");
  }

  return (
    <div className="bg-brand-subtle flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <NawoLogo />
      <div className="card-surface mt-8 w-full max-w-sm p-6 text-center">
        <span className="bg-primary-soft mx-auto mb-4 grid size-12 place-items-center rounded-full text-primary">
          <MailCheck className="size-6" />
        </span>
        <h1 className="text-xl font-extrabold tracking-tight">Vérifiez votre email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nous avons envoyé un lien de vérification{email ? ` à ${email}` : ""}. Confirmez votre
          adresse pour utiliser pleinement votre compte.
        </p>
        {email ? (
          <Button variant="outline" className="mt-5 w-full" onClick={resend}>
            Renvoyer l'email
          </Button>
        ) : null}
        <Button className="mt-3 w-full" asChild>
          <Link to="/login">Aller à la connexion</Link>
        </Button>
      </div>
    </div>
  );
}
