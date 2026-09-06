import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { NawoLogo } from "@/components/nawo/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api-client";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
    email: typeof search["email"] === "string" ? search["email"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — NAWO" },
      {
        name: "description",
        content: "Définissez un nouveau mot de passe pour votre compte organisateur NAWO.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Nouveau mot de passe — NAWO" },
      { property: "og:description", content: "Définissez un nouveau mot de passe." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token, email } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, email, password, password_confirmation: password }),
      });
    } catch (error) {
      setLoading(false);
      toast.error(error instanceof Error ? error.message : "Lien invalide.");
      return;
    }
    setLoading(false);
    toast.success("Mot de passe mis à jour.");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="bg-brand-subtle flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <NawoLogo />
      <form onSubmit={handleSubmit} className="card-surface mt-8 w-full max-w-sm space-y-4 p-6">
        <h1 className="text-xl font-extrabold tracking-tight">Nouveau mot de passe</h1>
        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          Mettre à jour
        </Button>
      </form>
    </div>
  );
}
