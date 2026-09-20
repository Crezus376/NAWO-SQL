import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NawoLogo } from "@/components/nawo/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedForm } from "@/components/ui/validated-form";
import { apiAuth } from "@/lib/api-client";
import { redirectAuthenticatedUser } from "@/lib/route-guards";

export const Route = createFileRoute("/register")({
  ssr: false,
  beforeLoad: redirectAuthenticatedUser,
  head: () => ({
    meta: [
      { title: "Créer un compte organisateur — NAWO" },
      {
        name: "description",
        content:
          "Créez votre compte NAWO en 30 secondes : email et mot de passe suffisent pour lancer votre billetterie.",
      },
      { property: "og:title", content: "Créer un compte organisateur — NAWO" },
      {
        property: "og:description",
        content: "Email + mot de passe, et votre billetterie est prête.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    let error: Error | null = null;
    try {
      await apiAuth.register(email, password);
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
    }
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compte créé. Vérifiez votre email pour continuer.");
    navigate({ to: "/verify-email", search: { email } });
  }

  return (
    <div className="bg-brand-subtle flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <NawoLogo />
      <div className="card-surface mt-8 w-full max-w-sm p-6">
        <h1 className="text-xl font-extrabold tracking-tight">Créer un compte</h1>
        <p className="mt-1 text-sm text-muted-foreground">Email et mot de passe. Rien de plus.</p>

        <ValidatedForm onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Créer mon compte
          </Button>
        </ValidatedForm>

        <p className="mt-5 text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link to="/login" className="font-medium text-primary">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
