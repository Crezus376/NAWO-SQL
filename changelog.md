# Changelog

## 2026-09-06

### Migration Laravel 10 + MySQL

- Ajout du backend Laravel dans `backend/` et de MySQL 8 dans `compose.yaml`.
- Recréation des 17 tables métier avec UUID, relations, index et stockage Laravel.
- Sécurisation transactionnelle des achats, stocks, scans et retraits.
- Ajout des API organisateur/admin, des médias publics et des preuves de retrait privées.
- Validation par build frontend, TypeScript, migrations MySQL, tests Laravel et smoke test HTTP Sanctum.
- Extension de la recette automatique à 55 tests fonctionnels et 439 assertions couvrant l'ensemble des routes backend, les droits, les achats, scans, retraits et uploads.
- Durcissement de l'API de compatibilité : mutations limitées par table et par champ, ressources publiques actives uniquement, protection contre le changement de propriétaire et les liaisons entre événements.
- Correction de la validation des sessions au scan, de la table de jointure des tarifs, des valeurs par défaut renvoyées et des erreurs de traitement des retraits admin.
- Ajout des quotas ciblés, en-têtes de sécurité, sessions persistées, révocation globale et suppression de compte.
- Ajout des notifications en queue, de la pagination, du nettoyage des médias et d'un endpoint de santé hors quota.
- Correction du stockage UUID des jetons Sanctum et du double scan concurrent des billets sans session, détectés sur MySQL réel.
- Ajout de Playwright desktop/mobile, d'un test de charge et des images PHP/Node/Nginx.
- Isolation des preuves de retrait dans `storage/app/private` et validation finale ESLint, TypeScript, build, Pint et tests Laravel.
- Avertissement : Laravel 10 est conservé à la demande du projet malgré sa fin de support sécurité ; trois avis Composer sont explicitement ignorés dans le lock du backend.
