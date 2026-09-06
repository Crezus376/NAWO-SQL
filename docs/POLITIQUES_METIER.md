# Politiques métier avant mise en production

## Paiements

Le paiement manuel actuel est réservé à la recette. Un prestataire ne peut être activé qu'avec une référence externe unique, une vérification cryptographique des webhooks, une confirmation idempotente côté serveur et une journalisation sans données bancaires. Aucun statut `paid` ne doit dépendre d'une valeur envoyée par le navigateur.

## Annulations et remboursements

- Un événement annulé n'accepte plus aucun achat.
- Un billet déjà scanné n'est pas remboursable automatiquement.
- Avant l'intégration d'un prestataire, tout remboursement est traité hors plateforme et consigné par l'administrateur.
- Avec un prestataire, le remboursement doit être initié côté serveur, conserver la référence fournisseur et mettre à jour commande, paiement et billet dans une transaction.
- Le délai, les frais conservés et les cas de force majeure doivent être validés juridiquement avant publication des conditions de vente.

## Comptes et sessions

- Mot de passe : 8 caractères minimum, configurable par `PASSWORD_MIN_LENGTH`.
- Session inactive : 120 minutes par défaut, configurable par `SESSION_LIFETIME`.
- En production : session en base, cookie `Secure`, `HttpOnly` et `SameSite=Lax`.
- La déconnexion globale révoque les jetons API et les autres sessions persistées.
- La vérification d'email reste volontairement désactivée pendant la recette ; sa réactivation est une décision de mise en production.

## Conservation

Les preuves de retrait sont privées. Leur durée légale de conservation, ainsi que celle des commandes et journaux de scan, doit être validée selon le pays d'exploitation avant qu'une purge automatique soit activée.
