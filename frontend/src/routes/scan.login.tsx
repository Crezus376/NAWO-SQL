import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { NawoLogo } from "@/components/nawo/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedForm } from "@/components/ui/validated-form";
import { hostLogin } from "@/lib/nawo.functions";

export const HOST_CODE_KEY = "nawo_host_code";

export const Route = createFileRoute("/scan/login")({
  head: () => ({
    meta: [
      { title: "Accès scan — NAWO" },
      {
        name: "description",
        content:
          "Connectez-vous avec votre code d'accès agent pour scanner les billets à l'entrée.",
      },
      { property: "og:title", content: "Accès scan — NAWO" },
      { property: "og:description", content: "Contrôle d'accès des billets NAWO." },
    ],
  }),
  component: ScanLoginPage,
});

function ScanLoginPage() {
  const navigate = useNavigate();
  const login = hostLogin;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login({ data: { code: code.trim() } });
      if (!result) {
        toast.error("Code d'accès invalide.");
        return;
      }
      localStorage.setItem(HOST_CODE_KEY, code.trim());
      toast.success(`Bienvenue ${result.name}`);
      navigate({ to: "/scan" });
    } catch {
      toast.error("Code d'accès invalide.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-brand flex min-h-screen flex-col items-center justify-center px-5 py-12 text-primary-foreground">
      <NawoLogo inverted />
      <ValidatedForm
        onSubmit={handleSubmit}
        className="mt-8 w-full max-w-sm rounded-2xl bg-background p-6 text-foreground shadow-soft"
      >
        <span className="bg-primary-soft mb-4 grid size-12 place-items-center rounded-full text-primary">
          <ScanLine className="size-6" />
        </span>
        <h1 className="text-xl font-extrabold tracking-tight">Interface de scan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entrez le code d'accès fourni par l'organisateur.
        </p>
        <div className="mt-5 space-y-1.5">
          <Label htmlFor="code" required>
            Code d'accès
          </Label>
          <Input
            id="code"
            required
            autoCapitalize="characters"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="text-center text-lg font-bold tracking-[0.2em]"
          />
        </div>
        <Button type="submit" size="lg" className="mt-5 w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Accéder au scan
        </Button>
      </ValidatedForm>
    </div>
  );
}
