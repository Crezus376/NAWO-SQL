# NAWO : état du projet et migration React + Laravel

Analyse initiale du code importé, le 5 septembre 2026. La migration a depuis été implémentée dans `backend/` ; son état courant et les actions restant à réaliser sont suivis dans [CHECKLIST_MIGRATION_LARAVEL.md](./CHECKLIST_MIGRATION_LARAVEL.md). Les sections ci-dessous restent le constat de départ ayant motivé la migration.

## Architecture constatée

NAWO est une billetterie événementielle avec catalogue public, achat, billet QR,
espace organisateur, administration et contrôle d'accès par journée.

L'interface est déjà en React 19 + TypeScript, avec Tailwind 4, Radix/shadcn,
TanStack Query et TanStack Router. TanStack Start assure le rendu serveur et les
fonctions serveur. Vite utilise un préréglage Lovable ; ce n'est pas une simple
application React statique et aucun backend Laravel n'est encore présent.

Supabase fournit PostgreSQL, l'authentification, les règles d'accès RLS et le
stockage. Les pages interrogent souvent directement Supabase ; les opérations
de billetterie et de retrait passent par `src/lib/*.functions.ts`, puis les
services `*.server.ts` utilisant une clé privilégiée.

Huit migrations SQL décrivent 17 tables métier publiques : profils, rôles,
événements, pages personnalisées, tarifs, modèles de billets, promotions,
ambassadeurs, agents de scan, commandes, paiements, billets, scans, sessions,
liaisons tarifs/sessions, droits d'accès et retraits. Les utilisateurs Auth et
les objets Storage sont gérés dans des schémas Supabase séparés.

## Première remise en route

L'import contient `env` et `gitignore`, noms que Vite et Git ne traitent pas comme
leurs fichiers de configuration habituels. Une copie locale `.env.local` et un
véritable `.gitignore` ont été ajoutés. Les fichiers importés sont conservés.
Les fichiers `.prettierrc` et `.prettierignore` ont également été rétablis.
La commande `dev` charge explicitement `.env.local` dans Node afin que les
variables serveur sans préfixe `VITE_` soient disponibles, sans les exposer au client.
Le fichier `env` est déjà suivi par Git ; les clés qu'il contient sont les clés
publiques de connexion, pas une clé de service. Ne pas y ajouter de secret.

La clé `SUPABASE_SERVICE_ROLE_KEY` n'est pas fournie. Sans elle, les fonctions
serveur de billetterie, consultation de billet, scan et retrait ne sont pas
opérationnelles. Les emails de retrait nécessitent en plus une configuration
Resend facultative. Les fichiers SQL sont un schéma, pas une sauvegarde des
utilisateurs, données métier ou fichiers téléchargés.

## Points à traiter avant une exploitation réelle

| Constat dans le code | Conséquence et traitement cible |
| --- | --- |
| `nawo.server.ts`, `createPaidOrder` : paiement `manual` confirmé immédiatement | Paiement simulé ; prévoir un prestataire et une confirmation serveur vérifiée et idempotente avant émission du billet. |
| Achat : écritures successives et compteurs lus puis incrémentés | Risque de commande partielle et de survente concurrente ; transactions et verrouillage SQL. |
| `scanTicket` : lecture du droit puis écriture séparée | Deux scans simultanés peuvent être acceptés ; consommation atomique du droit d'accès et journalisation transactionnelle. |
| `createWithdrawal` : vérification du solde puis insertion séparée | Des demandes simultanées peuvent dépasser le solde ; verrouillage et réservation du solde en transaction. |
| Plusieurs écritures Supabase n'inspectent pas `error` | Des échecs peuvent passer inaperçus ; gestion explicite des erreurs et rollback. |
| `nawo.ts` : URLs d'images signées pour dix ans et stockées en base | Exporter les objets, remplacer les URLs et distinguer médias publics et justificatifs privés. |
| Auth, appels de données et règles RLS répartis entre interface et SQL | Reconstituer les autorisations dans Laravel et tester l'isolation entre organisateurs. |
| RPC `organizer_balance(uuid)` en `SECURITY DEFINER`, accordée à `authenticated`, sans contrôle de l'identité demandée dans son corps | Le schéma autorise un utilisateur connecté à demander le solde d'un autre UUID ; restreindre au serveur ou vérifier propriétaire/admin. Constat statique, non exploité sur le service distant. |

Ces risques de concurrence sont déduits du code ; aucun test concurrent n'a été
exécuté sur le service distant. Aucun achat ou retrait de test n'y a été créé.

## Cible proposée

Conserver les composants React, styles, formulaires et TanStack Query. Remplacer
progressivement les appels Supabase et fonctions TanStack par une API Laravel.
L'authentification, les autorisations, les fichiers et toutes les écritures métier
doivent être pris en charge par Laravel.

Le document importé vise Laravel 10. Pour un nouveau backend, retenir Laravel 13,
compatible avec PHP 8.4 présent sur cette machine ; Laravel 10 ne reçoit plus de
correctifs de sécurité depuis le 4 février 2025. Source :
[politique officielle de support](https://laravel.com/framework/docs/releases#support-policy).

PostgreSQL auto-hébergé est une option qui réduit les conversions de données.
MySQL reste possible si souhaité, mais React + Laravel n'impose pas ce changement.
Préserver les UUID pour faciliter la reprise des relations et des liens existants.

Une cible simple serait React compilé par Vite, servi par Nginx, avec `/api` vers
Laravel/PHP-FPM, une base SQL, du stockage local ou compatible S3 et un worker
pour les emails. L'authentification web pourra utiliser les cookies de session
avec Sanctum, sous la même origine. La suppression du rendu serveur TanStack doit
être arbitrée en tenant compte du référencement des pages publiques d'événements.

## Ordre de migration

1. Stabiliser la version locale, obtenir la configuration serveur manquante et
   utiliser une base de test avant de vérifier les parcours qui écrivent.
2. Créer Laravel, les migrations, les rôles, les Policies et l'authentification ;
   vérifier la séparation des données de deux organisateurs.
3. Migrer le catalogue et la gestion des événements, sessions et tarifs ; introduire
   une couche API dans React pour remplacer les appels directs Supabase par domaine.
4. Migrer achat, confirmation de paiement, émission du billet et scan avec des tests
   d'idempotence, de concurrence, de quotas et d'accès multi-journées.
5. Migrer retraits, administration, médias, pages personnalisées et notifications.
6. Répéter un import des données et fichiers, comparer les totaux, puis préparer une
   bascule avec gel des écritures et procédure de retour arrière.

Le guide MySQL importé est une base de travail, mais sa liste de tables omet
`ticket_templates`. Sa stratégie de réinitialisation des mots de passe doit être
confirmée selon les possibilités réelles d'export Auth ; ne pas considérer les
comptes comme migrés à partir d'un simple export des profils.

Le document WhatsApp décrit une évolution : aucun service WhatsApp correspondant
n'a été trouvé dans les fichiers applicatifs examinés.

## Vérifications exécutées

- Installation npm réussie : 455 paquets installés, audit npm sans vulnérabilité
  signalée au moment de l'installation. `package-lock.json` ajouté pour les
  installations reproductibles avec `npm ci`.
- `npm run build` : réussi, cible Cloudflare du préréglage conservée. Avertissements
  de dépréciation TanStack `inputValidator` et du plugin `vite-tsconfig-paths`.
- `npx tsc --noEmit` : réussi.
- ESLint après restauration de Prettier : 891 erreurs, dont 890 de formatage et
  une règle `prefer-const` dans `previewAuthStorage.ts`, plus 6 avertissements
  React Refresh. Pas de reformatage massif dans cette remise en route.
- Supabase distant, lectures seules : configuration Auth HTTP 200 et catalogue
  public HTTP 200 avec deux événements.
- Serveur local démarré sur `http://127.0.0.1:3000` : accueil, `/events`, `/login`
  et `/scan/login` répondent HTTP 200 avec leurs titres et du HTML applicatif.
- Aucun navigateur disponible via Browser : rendu interactif, hydratation,
  connexion avec un compte, caméra et parcours métier non validés.
