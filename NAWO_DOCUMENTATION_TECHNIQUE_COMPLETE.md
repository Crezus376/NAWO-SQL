# NAWO — Documentation technique complète

## 1. Présentation

NAWO est une plateforme de billetterie événementielle : site public de vente, espace
organisateur, espace administration et interface de scan mobile.

Pile technique : React 19 + TanStack Start (routage fichiers, server functions),
Tailwind CSS v4, base de données Postgres managée (Supabase) avec RLS, stockage privé
de fichiers, authentification email/mot de passe.

## 2. Architecture des données

```text
EVENT      = informations générales (nom, slug, lieu, date de référence, devise, statut)
SESSION    = une journée de l'événement (date, horaires, lieu propre)
TICKET TYPE= un tarif + les sessions auxquelles il donne accès
ORDER      = achat d'un acheteur (montant, remise, statut)
TICKET     = billet émis (numéro, QR token, porteur)
ACCESS     = droit d'accès d'un billet à une session (une ligne par journée)
SCAN       = ticket + session + résultat + horodatage
```

### Tables principales

| Table | Rôle |
| --- | --- |
| `profiles` | profil utilisateur (email, nom) |
| `user_roles` | rôles séparés (`admin`, `organizer`, `host`, `participant`) |
| `events` | événements, appartiennent à un `organizer_id` |
| `event_sessions` | journées d'un événement |
| `ticket_types` | tarifs, quota, visuel |
| `ticket_type_sessions` | journées couvertes par un tarif |
| `orders`, `payments` | commandes et paiements |
| `tickets` | billets émis avec QR |
| `ticket_session_access` | droit d'accès par journée, consommé au scan |
| `scans` | journal des scans |
| `hosts` | agents de scan (code d'accès) |
| `promo_codes`, `ambassadors` | remises et suivi de vente |
| `event_pages` | page personnalisée (mode, statut, contenu JSON) |
| `withdrawals` | demandes de retrait des organisateurs |

### Triggers

- `handle_new_user` : crée le profil et le rôle `organizer` à l'inscription.
- `create_main_session` : crée automatiquement « Journée principale » à la création d'un événement.
- `sync_custom_page_request` : crée une demande de page personnalisée en statut `pending`.
- `set_updated_at` : met à jour `updated_at`.

### Fonctions

- `has_role(user_id, role)` — vérification de rôle (SECURITY DEFINER, évite la récursion RLS).
- `organizer_balance(user_id)` — recettes payées moins retraits en cours ou payés.

## 3. Sécurité

- RLS activée sur toutes les tables publiques, plus `GRANT` explicites par rôle.
- Lecture publique limitée aux événements publiés, tarifs actifs, sessions et pages actives.
- Écritures sur commandes, billets, accès et scans réservées au serveur (clé de service).
- Rôles stockés hors de `profiles` pour empêcher l'élévation de privilèges.
- Aucun mot de passe ni clé de service n'est présent côté navigateur.

## 4. Parcours fonctionnels

### Achat
1. Le visiteur ouvre `/e/{slug}` (page standard ou personnalisée).
2. Il choisit un tarif, remplit nom/email, applique un code promo ou un lien ambassadeur.
3. Le serveur vérifie la disponibilité, calcule le prix, crée commande + paiement + billet,
   puis crée un droit d'accès par journée couverte.
4. Redirection vers `/ticket/{id}` : QR unique, visuel du billet, liste des journées.

### Scan
1. L'agent se connecte sur `/scan/login` avec son code d'accès.
2. Il choisit la journée à contrôler (préselection sur la date du jour).
3. Verdicts : `valid`, `already_used`, `invalid`, `unauthorized`, `not_allowed`.
4. Le billet est marqué globalement utilisé quand toutes ses journées sont consommées.

### Page personnalisée
1. L'organisateur choisit « Page personnalisée » et envoie un brief.
2. L'administrateur édite le contenu (thème or/violet/néon, hero, line-up, dress code, CTA).
3. Une fois active, la page publique utilise le rendu personnalisé.

### Retraits
1. Solde = recettes payées − retraits en attente/en cours/payés.
2. L'organisateur demande un retrait (montant libre ou solde total), 10 % de frais.
3. La demande est vérifiée côté serveur (solde, minimum, propriété de l'événement).
4. L'administrateur traite la demande : statut, référence, preuve de paiement (stockage privé).
5. Un reçu NAWO imprimable est disponible pour tout retrait payé.

## 5. Emails

Les notifications (nouvelle demande de retrait à l'admin, versement effectué à l'organisateur)
sont envoyées via Resend si les variables serveur `RESEND_API_KEY`, `NAWO_EMAIL_FROM` et
`NAWO_APP_URL` sont configurées. Sans configuration, l'application reste fonctionnelle et
n'envoie simplement aucun email.

## 6. Organisation du code

```text
src/routes/                 pages (publiques, /dashboard, /admin, /scan)
src/routes/_authenticated/  espace protégé (organisateur + admin)
src/components/nawo/        composants métier (billet, page événement, shell)
src/lib/nawo.ts             utilitaires client (formatage, upload)
src/lib/nawo.server.ts      logique serveur billetterie et scan
src/lib/nawo.functions.ts   points d'entrée serveur appelés depuis l'interface
src/lib/withdrawals.*.ts    logique et points d'entrée des retraits
supabase/migrations/        schéma, RLS, triggers
```

## 7. Règles à respecter

- Toute écriture sensible passe par une fonction serveur, jamais par le navigateur.
- Un organisateur ne voit que ses propres événements ; l'administrateur voit tout.
- Un retrait déjà payé ne peut plus être retraité.
- Les frais de 10 % sont calculés côté serveur, jamais depuis l'interface.
