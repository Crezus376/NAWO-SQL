import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NawoLogo } from "@/components/nawo/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedForm } from "@/components/ui/validated-form";
import { ApiError, apiAuth } from "@/lib/api-client";
import { redirectAuthenticatedUser } from "@/lib/route-guards";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: redirectAuthenticatedUser,
  head: () => ({
    meta: [
      { title: "Connexion organisateur — NAWO" },
      {
        name: "description",
        content:
          "Connectez-vous à votre espace organisateur NAWO pour gérer vos événements et vos ventes.",
      },
      { property: "og:title", content: "Connexion organisateur — NAWO" },
      { property: "og:description", content: "Accédez à votre espace organisateur NAWO." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    let error: Error | null = null;
    try {
      await apiAuth.login(email, password);
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
    }
    setLoading(false);
    if (error) {
      if (error instanceof ApiError && error.code === "email_unverified") {
        navigate({ to: "/verify-email", search: { email } });
        return;
      }
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="bg-brand-subtle flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <NawoLogo />
      <div className="card-surface mt-8 w-full max-w-sm p-6">
        <h1 className="text-xl font-extrabold tracking-tight">Connexion</h1>
        <p className="mt-1 text-sm text-muted-foreground">Accédez à votre espace organisateur.</p>

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Se connecter
          </Button>
        </ValidatedForm>

        <div className="mt-5 space-y-2 text-sm">
          <Link to="/forgot-password" className="block text-muted-foreground hover:text-primary">
            Mot de passe oublié ?
          </Link>
          <Link to="/register" className="block font-medium text-primary">
            Créer un compte organisateur
          </Link>
        </div>
      </div>
    </div>
  );
}
