import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { NawoLogo } from "@/components/nawo/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
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
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
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
