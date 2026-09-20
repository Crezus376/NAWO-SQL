import { expect, test } from "@playwright/test";

test("inscription, événement, tarif, achat et scan manuel", async ({ page }) => {
  const suffix = `${Date.now()}-${test.info().project.name}`;
  const email = `e2e-${suffix}@example.test`;
  const password = "Playwright12x";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/dashboard/events/create");
  await page.getByLabel("Nom de l'événement").fill(`Festival E2E ${suffix}`);
  await page.getByLabel("Date").fill("2027-12-20");
  await page.getByLabel("Lieu").fill("Cotonou");
  await page.getByRole("button", { name: "Créer l'événement" }).click();
  await expect(page).toHaveURL(/\/dashboard\/events\/([^/]+)\/tickets$/);
  const eventId = page.url().match(/events\/([^/]+)\/tickets/)?.[1];
  expect(eventId).toBeTruthy();

  await page.getByLabel("Nom", { exact: true }).fill("Standard E2E");
  await page.getByLabel("Prix").fill("10000");
  await page.getByLabel("Quantité").fill("5");
  await page.getByRole("button", { name: "Ajouter" }).click();
  await expect(page.getByText("Standard E2E", { exact: true })).toBeVisible();

  const setup = await page.evaluate(async (id) => {
    const token = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("XSRF-TOKEN="))
        ?.split("=")
        .slice(1)
        .join("=") ?? "",
    );
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": token,
    };
    await fetch(`/api/organizer/events/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify({ status: "published" }),
    });
    const event = await fetch(`/api/organizer/events/${id}`, {
      credentials: "include",
      headers,
    }).then((response) => response.json());
    const types = await fetch(`/api/organizer/events/${id}/ticket-types`, {
      credentials: "include",
      headers,
    }).then((response) => response.json());
    const host = await fetch(`/api/organizer/events/${id}/hosts`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ name: "Agent E2E", access_code: `E2E${Date.now()}` }),
    }).then((response) => response.json());
    return { slug: event.data.slug, typeId: types.data[0].id, hostCode: host.data.access_code };
  }, eventId);

  await page.goto(`/e/${setup.slug}/buy?type=${setup.typeId}`);
  await page.getByLabel("Prénom").fill("Ada");
  await page.getByLabel("Nom").fill("Lovelace");
  await page.getByLabel("Email (réception du billet)").fill("buyer@example.test");
  await page.getByRole("button", { name: "Payer et recevoir mon billet" }).click();
  await expect(page.getByRole("heading", { name: "Paiement confirmé" })).toBeVisible();
  const ticketId = new URL(page.url()).searchParams.get("ticket");
  expect(ticketId).toBeTruthy();
  const qrToken = await page.evaluate(
    async (id) =>
      fetch(`/api/tickets/${id}`)
        .then((response) => response.json())
        .then((body) => body.data.ticket.qr_token),
    ticketId,
  );

  await page.goto("/scan/login");
  await page.getByLabel("Code d'accès").fill(setup.hostCode);
  await page.getByRole("button", { name: "Accéder au scan" }).click();
  await expect(page).toHaveURL(/\/scan\/?$/);
  await page.getByPlaceholder("Saisie manuelle du code billet").fill(qrToken);
  await page.getByRole("button", { name: "Valider" }).click();
  await expect(page.getByText("Billet valide", { exact: true })).toBeVisible();
});
