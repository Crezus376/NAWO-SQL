import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2, MailCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { NawoLogo } from "@/components/nawo/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedForm } from "@/components/ui/validated-form";
import { apiDb } from "@/lib/api-client";
import { redirectAuthenticatedUser } from "@/lib/route-guards";

export const Route = createFileRoute("/verify-email")({
  ssr: false,
  beforeLoad: redirectAuthenticatedUser,
  validateSearch: (search: Record<string, unknown>): { email?: string; status?: string } => ({
    ...(typeof search["email"] === "string" ? { email: search["email"] } : {}),
    ...(typeof search["status"] === "string" ? { status: search["status"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Vérifiez votre email — NAWO" },
      {
        name: "description",
        content: "Confirmez votre adresse email pour activer votre compte organisateur NAWO.",
      },
      { property: "og:title", content: "Vérifiez votre email — NAWO" },
      { property: "og:description", content: "Confirmez votre adresse email NAWO." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email: initialEmail, status } = useSearch({ from: "/verify-email" });
  const [email, setEmail] = useState(initialEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const verified = status === "verified";
  const invalid = status === "invalid";

  async function resend(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiDb.auth.resendVerification(email);
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d’envoyer l’email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-brand-subtle flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <NawoLogo />
      <div className="card-surface mt-8 w-full max-w-sm p-6">
        <span className="bg-primary-soft mx-auto mb-4 grid size-12 place-items-center rounded-full text-primary">
          {verified ? (
            <CheckCircle2 className="size-6" />
          ) : invalid ? (
            <TriangleAlert className="size-6" />
          ) : (
            <MailCheck className="size-6" />
          )}
        </span>
        <h1 className="text-center text-xl font-extrabold tracking-tight">
          {verified
            ? "Email vérifié"
            : invalid
              ? "Lien invalide ou expiré"
              : "Vérifiez votre email"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {verified
            ? "Votre adresse email est confirmée. Vous pouvez maintenant vous connecter."
            : invalid
              ? "Demandez un nouveau lien pour confirmer votre adresse email."
              : sent
                ? "Si un compte existe et que son adresse n’est pas encore vérifiée, un email a été envoyé."
                : "Consultez votre boîte de réception pour confirmer votre adresse avant de vous connecter."}
        </p>

        {!verified ? (
          <ValidatedForm onSubmit={resend} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="verification-email" required>
                Email
              </Label>
              <Input
                id="verification-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <MailCheck />}
              Renvoyer l’email
            </Button>
          </ValidatedForm>
        ) : null}

        <Button className="mt-5 w-full" variant={verified ? "default" : "outline"} asChild>
          <Link to="/login">Se connecter</Link>
        </Button>
      </div>
    </div>
  );
}
