import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { NawoLogo } from "@/components/nawo/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiDb } from "@/lib/api-client";

export const Route = createFileRoute("/forgot-password")({
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
    const { error } = await apiDb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else setSent(true);
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
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
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
          </form>
        )}
        <Link to="/login" className="mt-5 block text-sm text-muted-foreground hover:text-primary">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
