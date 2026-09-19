# Checklist exhaustive — migration Supabase vers Laravel 10 + MySQL

État au 6 septembre 2026. Les cases cochées correspondent à du code présent et vérifié dans ce dépôt. Les cases non cochées relèvent de la bascule réelle, de services ou appareils externes, de décisions métier, ou d'un refactor non bloquant explicitement identifié.

## 0. Décisions et garde-fous

- [x] Conserver le frontend React/TanStack et son design.
- [x] Installer Laravel 10 dans `backend/`.
- [x] Utiliser MySQL 8 dans Docker sur le port local `3307`.
- [x] Utiliser une API même origine sous `/api` et Sanctum par cookie.
- [x] Conserver les UUID Supabase lors de l'import.
- [x] Stocker les médias publics sur le disque Laravel `public`.
- [x] Stocker les preuves de retrait sur le disque Laravel privé `local`.
- [x] Garder le paiement manuel actuel pendant la phase de test.
- [x] Désactiver la vérification d'email pendant la phase de test.
- [x] Journaliser les emails localement par défaut (`MAIL_MAILER=log`).
- [x] Laravel 10 conservé en connaissance de cause à la demande du projet ; risque EOL et avis Composer consignés.
- [ ] Définir la date/heure du gel des écritures Supabase et le responsable de la bascule.
- [x] Procédure de retour arrière et conservation recommandée de 14 jours documentées dans `EXPLOITATION_ET_BASCULE.md`.

## 1. Recensement et retrait des connexions Supabase

- [x] Auth navigateur : connexion, inscription, session, déconnexion, mot de passe oublié et réinitialisation recensés.
- [x] Catalogue public : accueil, liste d'événements, détail et achat recensés.
- [x] Organisateur : événements, sessions, tarifs, promotions, ambassadeurs, hôtes, ventes et paramètres recensés.
- [x] Administration : statistiques, événements, pages personnalisées, modèles de billets et retraits recensés.
- [x] Billetterie : création de commande, paiement manuel, billet, droits par session et scan recensés.
- [x] Stockage : `event-images`, `ticket-images`, `withdrawal-proofs` recensés.
- [x] RPC Supabase de solde organisateur recensée et remplacée.
- [x] Suppression des clients navigateur et serveur `src/integrations/supabase/`.
- [x] Suppression de `nawo.server.ts` et `withdrawals.server.ts`.
- [x] Suppression du paquet `@supabase/supabase-js` et mise à jour du lock npm.
- [x] Suppression des variables Supabase du modèle `.env.example` frontend.
- [x] Vérification par recherche : aucune référence Supabase active dans `src/`.
- [x] Migrations `supabase/` conservées jusqu'à validation finale de l'import et du rollback.
- [ ] Supprimer/archiver `supabase/` uniquement après la période de retour arrière.

## 2. Socle Laravel et MySQL

- [x] Projet Laravel 10.50.3 créé et dépendances verrouillées.
- [x] Sanctum 3 installé et middleware stateful activé.
- [x] Configuration CORS avec credentials et origine frontend.
- [x] Docker Compose MySQL 8, volume persistant et healthcheck.
- [x] `.env.example` backend configuré pour MySQL `127.0.0.1:3307`.
- [x] Clé d'application locale générée.
- [x] Lien `public/storage` créé.
- [x] Base MySQL réelle démarrée et migration exécutée.
- [x] Tests configurés sur SQLite en mémoire pour rester rapides et isolés.
- [x] Compose de production sans identifiants par défaut et modèle `.env.production.example` ajoutés.
- [x] Scripts de sauvegarde/restauration MySQL, politique de rétention et restauration isolée testée.

## 3. Schéma et modèles

- [x] `users` en UUID avec identité utilisateur et rôles séparés.
- [x] Événements et pages personnalisées.
- [x] Sessions/journées, tarifs et liaison plusieurs-à-plusieurs.
- [x] Modèles visuels de billets et positions QR.
- [x] Codes promotionnels et périodes d'activité.
- [x] Ambassadeurs et codes de référence.
- [x] Hôtes/agents et codes d'accès.
- [x] Commandes avec clé d'idempotence unique.
- [x] Paiements, billets et jetons QR uniques.
- [x] Droits d'accès par session et journal des scans.
- [x] Retraits, frais, preuve privée et traitement administratif.
- [x] Clés étrangères, unicités et index principaux.
- [x] Colonnes et enums comparés aux migrations Supabase ; correspondance et différences volontaires documentées.

## 4. Authentification et autorisations

- [x] Inscription Laravel avec rôle `organizer` et session immédiate.
- [x] Vérification email désactivée explicitement pour les tests.
- [x] Connexion/déconnexion avec rotation/invalidation de session.
- [x] Endpoint `/api/auth/me` avec identité utilisateur, rôles et indicateur admin.
- [x] Demande et validation de réinitialisation de mot de passe.
- [x] URL de reset dirigée vers le frontend React.
- [x] Middleware administrateur.
- [x] Contrôle de propriété serveur sur les événements et ressources associées.
- [x] Test automatique empêchant un organisateur de lire l'événement d'un autre.
- [ ] Configurer un vrai transport email avant recette du mot de passe oublié.
- [ ] Réactiver la vérification email avant production si elle est requise.
- [x] Limitation renforcée des tentatives de login, reset, achat et codes hôte.
- [x] Durée de session, mot de passe minimal, sessions persistées et révocation globale définis.

## 5. API métier

- [x] Catalogue et détail d'événement public.
- [x] CRUD événements organisateur avec image.
- [x] CRUD sessions, tarifs, promotions, ambassadeurs et hôtes.
- [x] Statistiques organisateur et événement.
- [x] Achat transactionnel avec verrou de stock, promotion et idempotence.
- [x] Émission du billet et création atomique des droits par journée.
- [x] Consultation publique du billet par UUID.
- [x] Login hôte et scan atomique par session.
- [x] Journalisation des scans valides, invalides, refusés et déjà utilisés.
- [x] Calcul du solde et demande de retrait sous verrou.
- [x] Traitement administrateur et téléchargement autorisé des preuves privées.
- [x] Administration des pages personnalisées et modèles de billets.
- [x] Couche de transition `/api/data` limitée à une liste de tables et filtrée par propriétaire/rôle.
- [ ] Remplacer progressivement la couche de transition par les endpoints métier déjà disponibles.
- [x] Pagination serveur opt-in (`page`, `per_page`, maximum 100) ajoutée aux grandes listes.
- [x] Notifications d'achat et de retrait mises en queue ; worker inclus dans le Compose de production.
- [ ] Intégrer un prestataire de paiement et vérifier les webhooks signés.
- [x] Politique d'annulation/remboursement documentée dans `POLITIQUES_METIER.md`.

## 6. Connexion du frontend

- [x] Client `fetch` centralisé avec erreurs JSON et credentials.
- [x] Récupération du cookie CSRF et envoi de `X-XSRF-TOKEN`.
- [x] Adaptateur temporaire des requêtes existantes vers Laravel.
- [x] Auth React raccordée à Laravel.
- [x] Uploads d'images raccordés au stockage Laravel.
- [x] Upload des preuves raccordé au stockage privé.
- [x] Achat, billet, scan et retraits raccordés aux endpoints Laravel.
- [x] Proxy Vite pour `/api`, `/sanctum` et `/storage`.
- [x] Inscription redirigée directement vers le dashboard.
- [x] Page de vérification transformée en information de mode test.
- [x] Build Vite de production réussi.
- [x] Vérification TypeScript `tsc --noEmit` réussie.
- [x] ESLint réussi sans erreur et intégré à la CI (six avertissements Fast Refresh non bloquants dans les composants UI).
- [ ] Exécuter la recette visuelle et interactive dans un vrai navigateur.
- [ ] Tester caméra/permissions QR sur Android et iOS réels.
- [ ] Vérifier le rendu SSR en environnement d'hébergement cible.

## 7. Import des données Supabase

- [x] Commande `php artisan nawo:import-supabase` créée.
- [x] Import des utilisateurs Auth avec UUID et email.
- [x] Import ordonné des 17 tables publiques.
- [x] Conversion des URLs de médias vers les disques Laravel.
- [x] Génération des clés absentes (`idempotency_key`, ancien rôle sans UUID).
- [x] Option destructive `--fresh` protégée par confirmation.
- [ ] Faire un export/snapshot Supabase avant la répétition générale.
- [x] Lancer l'import de répétition avec la clé `service_role`.
- [x] Comparer les nombres de lignes table par table : 1 utilisateur, 1 rôle, 1 événement, 2 sessions, 1 tarif, 2 liaisons, 1 commande, 1 paiement, 1 billet et 2 droits d'accès.
- [x] Comparer les agrégats disponibles : une commande payée, revenu total `80 000 XOF`, aucun utilisateur ou événement orphelin.
- [x] Importer le média public référencé et vérifier que les relances ne le dupliquent pas.
- [ ] Vérifier manuellement dans un navigateur chaque fichier importé et ses permissions.
- [ ] Demander aux utilisateurs migrés de réinitialiser leur mot de passe.
- [ ] Répéter l'import après gel des écritures pour la bascule finale.

Commande d'import :

```bash
cd backend
php artisan nawo:import-supabase --url=https://PROJET.supabase.co --key=SERVICE_ROLE
```

Les hash de mots de passe Supabase ne sont pas exportables par cette API. La commande attribue donc un mot de passe aléatoire non connu ; le flux « Mot de passe oublié » est obligatoire pour les comptes repris.

## 8. Tests et recette

- [x] Test inscription immédiatement vérifiée.
- [x] Test isolation entre deux organisateurs.
- [x] Test achat idempotent.
- [x] Test capacité et refus après épuisement.
- [x] Test scan valide puis double scan refusé.
- [x] Suite Laravel : 55 tests fonctionnels, 439 assertions.
- [x] Smoke test HTTP réel inscription + `/auth/me` avec cookie Sanctum sur MySQL, y compris via le proxy Vite `:8080`.
- [x] Tests CRUD des événements, sessions, tarifs, promotions, ambassadeurs et hôtes.
- [x] Tests des droits invité/organisateur/admin, de l'isolation IDOR et des tables en lecture seule.
- [x] Tests du catalogue public, détail événement, billet public et pages actives/inactives.
- [x] Tests achats : idempotence, capacité, promotions, ambassadeurs et rattachement aux sessions.
- [x] Tests retraits : solde, frais, minimum, montant total, reçu et transitions de statut admin.
- [x] Deux demandes de retrait réellement concurrentes testées sur MySQL : une créée, une refusée.
- [x] Test multi-journées et billet sans liaison explicite.
- [x] Tests scan : hôte actif, invalide, interdit, valide, double scan, statistiques et isolation session/événement.
- [x] Tests upload : type MIME, taille et accès public/privé.
- [x] Nettoyage des anciens fichiers lors du remplacement/suppression des images, avec tests.
- [x] Tests de la commande d'import Supabase : utilisateurs, relations, médias, clé d'idempotence et relance.
- [x] Suite E2E Playwright écrite : inscription → événement → tarif → achat → scan manuel, desktop et mobile Chromium.
- [ ] Exécuter la suite Playwright dans un navigateur disponible (indisponible dans cette session ; CI prête).
- [x] Charge locale : 200 requêtes, concurrence 20, 0 échec, p95 273 ms sur `/api/health`.
- [x] Concurrence MySQL réelle : achat `201/422`, une commande ; scan `valid/already_used` après correction du verrou.
- [x] Audit local : CSRF, CORS, quotas, IDOR, en-têtes, secrets ignorés, npm audit et mitigation CRLF.
- [x] CI créée pour lint, TypeScript, build, Pint, tests Laravel et parcours Playwright sur MySQL.
- [ ] Recette métier signée sur desktop et mobile.

## 9. Bascule et exploitation

- [x] Images et Compose prêts pour PHP-FPM/Nginx, MySQL, frontend Node, worker et scheduler.
- [x] Routage même domaine Nginx prêt : `/api`, `/sanctum` et `/storage` vers Laravel.
- [x] Cookies `Secure` de production, proxies et en-têtes de sécurité configurés ; terminaison TLS à fournir par l'hébergeur.
- [x] Volumes publics/privés persistants et stratégie de sauvegarde/restauration documentés.
- [ ] Configurer logs centralisés, alertes, suivi des erreurs et métriques.
- [ ] Mettre l'application Supabase en lecture seule au début du gel.
- [ ] Exécuter l'import final et les contrôles de réconciliation.
- [ ] Exécuter le smoke test de production.
- [ ] Basculer le trafic et surveiller achats/scans/retraits.
- [ ] Garder le rollback prêt pendant la fenêtre convenue.
- [ ] Archiver les secrets et données Supabase après validation définitive.

## Commandes locales

```bash
docker compose up -d mysql
cd backend && composer install && php artisan migrate && php artisan storage:link
cd backend && php artisan serve --host=127.0.0.1 --port=8000
cd frontend && npm ci && npm run dev
```

Dans deux terminaux, l'API répond sur `http://127.0.0.1:8000`. Utilisez l'URL affichée par Vite pour le frontend (`8080` dans l'environnement Lovable actuel ; `3000` est également autorisé par Sanctum). Les emails de reset sont écrits dans `backend/storage/logs/laravel.log` avec la configuration locale actuelle.
