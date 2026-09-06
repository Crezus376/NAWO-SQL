# Correspondance du schéma Supabase → Laravel

Comparaison réalisée avec les migrations conservées dans `supabase/migrations` et le schéma Laravel/MySQL.

| Domaine Supabase | Cible Laravel | Décision |
|---|---|---|
| `auth.users` | `users` | UUID et email conservés ; mot de passe Laravel aléatoire à l'import |
| `profiles`, `user_roles` | mêmes tables | rôles conservés sous forme de chaînes validées côté API |
| `events` | `events` | enums stockés en chaînes et validés par Laravel ; `cover_image_url` devient `cover_image_path` |
| `event_pages` | `event_pages` | statuts identiques ; `content` reste JSON non nul avec `{}` par défaut |
| `event_sessions`, `ticket_type_sessions` | mêmes tables | UUID, unicité et cascades conservés |
| `ticket_types`, `ticket_templates` | mêmes tables | URLs d'images remplacées par des chemins de stockage Laravel |
| `promo_codes`, `ambassadors`, `hosts` | mêmes tables | champs, limites et unicités conservés |
| `orders` | `orders` | ajout volontaire de `idempotency_key` unique |
| `payments` | `payments` | statuts compatibles ; paiement manuel conservé pour la recette |
| `tickets`, `ticket_session_access`, `scans` | mêmes tables | jetons, usages par session et résultats conservés |
| `withdrawals` | `withdrawals` | `proof_url` devient `proof_path` privé ; statuts identiques |

Différences volontaires : timestamps Laravel ajoutés là où Supabase n'avait que `created_at`, chaînes contrôlées par validation à la place des enums PostgreSQL, événements terminés absents du catalogue de vente, et médias servis par Laravel. Les 17 tables importées et leurs agrégats ont été vérifiés lors de la répétition d'import.
