# NAWO — Migration de Supabase/Postgres vers Laravel 10 + MySQL

## 1. Objectif

Reproduire à l'identique le fonctionnement de NAWO sur une pile Laravel 10 + MySQL 8,
sans perte de données ni de règles métier.

## 2. Correspondances techniques

| Aujourd'hui | Laravel 10 |
| --- | --- |
| Auth Supabase | Laravel Breeze / Sanctum (`users` + `password`) |
| RLS Postgres | Policies Laravel (`app/Policies`) + scopes Eloquent |
| `has_role()` | table `user_roles` + `Gate::define` / `$user->hasRole()` |
| Server functions | Contrôleurs + Form Requests |
| Storage privé | disque `local` ou S3 privé + URLs temporaires signées |
| Triggers Postgres | Observers Eloquent (`EventObserver`) |
| `organizer_balance()` | méthode de service `BalanceService::for($user)` |
| Enums Postgres | colonnes `enum` MySQL ou casts PHP `enum` |

## 3. Schéma MySQL

Types :
- `uuid` → `char(36)` avec `$keyType = 'string'`, `$incrementing = false`.
- `numeric` → `decimal(12,2)`.
- `timestamptz` → `timestamp` (stocker en UTC).
- `jsonb` → `json`.

Tables à créer, dans cet ordre (contraintes de clés étrangères) :
`users`, `profiles`, `user_roles`, `events`, `event_sessions`, `ticket_types`,
`ticket_type_sessions`, `promo_codes`, `ambassadors`, `hosts`, `orders`, `payments`,
`tickets`, `ticket_session_access`, `scans`, `event_pages`, `withdrawals`.

Exemple de migration :

```php
Schema::create('withdrawals', function (Blueprint $t) {
    $t->char('id', 36)->primary();
    $t->char('organizer_id', 36)->index();
    $t->char('event_id', 36)->nullable()->index();
    $t->decimal('amount_requested', 12, 2);
    $t->decimal('fee_amount', 12, 2);
    $t->decimal('total_debited', 12, 2);
    $t->decimal('net_amount', 12, 2);
    $t->decimal('fee_rate', 5, 4)->default(0.1);
    $t->string('payout_method', 60);
    $t->string('payout_details', 200);
    $t->enum('status', ['pending','processing','paid','rejected','cancelled'])->default('pending');
    $t->string('transaction_reference')->nullable();
    $t->string('proof_url')->nullable();
    $t->text('admin_comment')->nullable();
    $t->text('organizer_note')->nullable();
    $t->char('processed_by', 36)->nullable();
    $t->timestamp('processed_at')->nullable();
    $t->timestamps();
    $t->foreign('organizer_id')->references('id')->on('users')->cascadeOnDelete();
    $t->foreign('event_id')->references('id')->on('events')->nullOnDelete();
});
```

## 4. Export / import des données

1. Export Postgres table par table en CSV (`\copy public.events TO 'events.csv' CSV HEADER`).
2. Nettoyage : dates en UTC, booléens `t/f` → `1/0`, `NULL` explicites.
3. Import MySQL : `LOAD DATA LOCAL INFILE 'events.csv' INTO TABLE events ...`.
4. Ordre d'import identique à l'ordre de création des tables.
5. Les utilisateurs Supabase Auth sont exportés (`id`, `email`, `created_at`) ; les mots de
   passe ne sont pas transférables : déclencher une réinitialisation obligatoire à la
   première connexion.

## 5. Règles métier à réimplémenter

- Création d'événement → créer automatiquement la session « Journée principale » (Observer).
- Passage en mode page personnalisée → créer une demande `event_pages` en `pending`.
- Achat : transaction SQL unique (commande, paiement, billet, accès par session, incrément
  du compteur vendu, incrément du code promo).
- Scan : verrou pessimiste (`lockForUpdate`) sur la ligne d'accès pour éviter le double scan.
- Retrait : contrôle du solde côté serveur, frais 10 %, minimum, interdiction de retraiter
  un retrait déjà payé.

## 6. Sécurité équivalente à la RLS

- Chaque requête organisateur passe par un scope `->where('organizer_id', auth()->id())`.
- Policies : `EventPolicy`, `WithdrawalPolicy`, `EventPagePolicy`.
- Middleware `role:admin` sur les routes d'administration.
- Endpoints publics : ne renvoyer que les événements publiés et les colonnes non sensibles.

## 7. Emails

Remplacer l'appel HTTP Resend par les Mailables Laravel (`WithdrawalRequested`,
`WithdrawalPaid`) et la file d'attente (`queue:work`).

## 8. Plan de bascule

1. Déployer Laravel en parallèle, base vide.
2. Importer les données en mode lecture seule côté ancienne plateforme.
3. Rejouer les tests : achat, scan multi-jours, retrait, page personnalisée.
4. Basculer le DNS, forcer la réinitialisation des mots de passe.
5. Conserver un export complet de l'ancienne base pendant 90 jours.
