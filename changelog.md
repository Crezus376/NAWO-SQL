# Changelog

## 2026-09-06

### Préparation des tests avant migration Laravel

- Le flux actuel d'inscription utilise Supabase Auth et demande normalement la
  confirmation de l'adresse email.
- Pour faciliter les tests fonctionnels avant la migration Laravel, la
  confirmation email doit être désactivée temporairement dans Supabase :
  `Authentication → Providers → Email → Confirm email`.
- Cette modification est un réglage du projet Supabase et ne peut pas être
  appliquée depuis ce dépôt. Elle devra être réactivée avant toute mise en
  production.
