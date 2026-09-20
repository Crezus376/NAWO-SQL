import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { NawoLogo } from "@/components/nawo/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedForm } from "@/components/ui/validated-form";
import { apiAuth } from "@/lib/api-client";
import { redirectAuthenticatedUser } from "@/lib/route-guards";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  beforeLoad: redirectAuthenticatedUser,
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — NAWO" },
      {
        name: "description",
        content:
          "Recevez un lien sécurisé pour réinitialiser le mot de passe de votre compte organisateur NAWO.",
      },
      { property: "og:title", content: "Mot de passe oublié — NAWO" },
      { property: "og:description", content: "Réinitialisez votre mot de passe NAWO." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiAuth.forgotPassword(email);
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Demande impossible");
    }
  }

  return (
    <div className="bg-brand-subtle flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <NawoLogo />
      <div className="card-surface mt-8 w-full max-w-sm p-6">
        <h1 className="text-xl font-extrabold tracking-tight">Mot de passe oublié</h1>
        {sent ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Un lien de réinitialisation vient d'être envoyé à {email}.
          </p>
        ) : (
          <ValidatedForm onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Envoyer le lien
            </Button>
          </ValidatedForm>
        )}
        <Link to="/login" className="mt-5 block text-sm text-muted-foreground hover:text-primary">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
