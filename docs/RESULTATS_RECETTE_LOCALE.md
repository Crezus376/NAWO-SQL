# Résultats de recette locale — 6 septembre 2026

## Automatisation

- Suite Laravel : 55 tests fonctionnels, 439 assertions réussies.
- TypeScript : `tsc --noEmit` réussi.
- Build Vite/Nitro : réussi.
- ESLint : 0 erreur (6 avertissements Fast Refresh non bloquants dans les composants UI) ; Pint réussi.
- npm audit production : aucune vulnérabilité.
- Composer : trois avis Laravel ignorés car Laravel 10 est imposé ; le risque CRLF utilisé par l'application est mitigé par le rejet explicite de `CR/LF` dans les emails. Les URL signées concernées ne sont pas utilisées.

## MySQL réel

- Migrations appliquées, y compris sessions, jobs, UUID Sanctum et alignement JSON.
- Achats simultanés sur une dernière place : HTTP `201` et `422`, une seule commande créée.
- Scans simultanés du même billet : `valid` et `already_used`. Ce test a trouvé puis permis de corriger un verrou manquant sur les billets sans session.
- Retraits simultanés dépassant ensemble le solde : HTTP `201` et `422`, une seule demande créée.
- Sauvegarde compressée contrôlée puis restaurée dans une base isolée ; comptage des événements identique avant suppression de la base de test.

## Charge

`/api/health` : 200 requêtes, concurrence 20, 0 échec, p50 247 ms, p95 273 ms, p99 275 ms avec le serveur PHP local. Le premier passage a révélé que le healthcheck était soumis au quota API ; il en a été correctement exclu.

## Limites externes

Le navigateur intégré n'était pas disponible dans cette session. La suite Playwright desktop/mobile et son job CI sont prêts, mais la recette visuelle et les permissions de caméra sur appareils physiques ne sont donc pas signées. La construction des images Docker a aussi été bloquée par la résolution DNS de Docker Hub ; la syntaxe Compose et les scripts shell sont validés. Les volumes Docker concordent avec les disques Laravel : médias publics sous `storage/app/public`, preuves privées sous `storage/app/private`.
