import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Loader2, Save, ShieldAlert, UserRound } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/nawo/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedForm } from "@/components/ui/validated-form";
import { apiAuth } from "@/lib/api-client";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Mon compte — NAWO" },
      {
        name: "description",
        content: "Gérez vos informations personnelles et la sécurité de votre compte NAWO.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useSession();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setProfileLoading(true);
    try {
      const updated = await apiAuth.updateProfile({ full_name: fullName.trim() || null });
      setFullName(updated.full_name ?? "");
      toast.success("Vos informations ont été mises à jour.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Impossible de mettre à jour le compte.",
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordLoading(true);
    try {
      await apiAuth.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: passwordConfirmation,
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordConfirmation("");
      toast.success("Votre mot de passe a été modifié.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Impossible de modifier le mot de passe.",
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <DashboardShell
      title="Mon compte"
      description="Gérez vos informations personnelles et la sécurité de votre accès."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="bg-primary-soft mb-2 grid size-10 place-items-center rounded-xl text-primary">
              <UserRound className="size-5" />
            </div>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Ces informations sont utilisées pour votre espace organisateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ValidatedForm onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Nom complet</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  maxLength={255}
                  placeholder="Votre nom complet"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account-email">Email</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  L’adresse email ne peut pas encore être modifiée.
                </p>
              </div>
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? <Loader2 className="animate-spin" /> : <Save />}
                Enregistrer
              </Button>
            </ValidatedForm>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="bg-primary-soft mb-2 grid size-10 place-items-center rounded-xl text-primary">
              <KeyRound className="size-5" />
            </div>
            <CardTitle>Sécurité</CardTitle>
            <CardDescription>
              Utilisez au moins 8 caractères pour votre nouveau mot de passe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ValidatedForm onSubmit={savePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-password" required>
                  Mot de passe actuel
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password" required>
                  Nouveau mot de passe
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password-confirmation" required>
                  Confirmer le nouveau mot de passe
                </Label>
                <Input
                  id="password-confirmation"
                  type="password"
                  required
                  minLength={8}
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" variant="outline" disabled={passwordLoading}>
                {passwordLoading ? <Loader2 className="animate-spin" /> : <KeyRound />}
                Modifier le mot de passe
              </Button>
            </ValidatedForm>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-muted bg-muted/30 opacity-60">
        <CardHeader>
          <div className="text-muted-foreground">
            <ShieldAlert className="size-5" />
          </div>
          <CardTitle>Zone dangereuse</CardTitle>
          <CardDescription>La suppression du compte n’est pas encore disponible.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            Supprimer mon compte
          </Button>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
