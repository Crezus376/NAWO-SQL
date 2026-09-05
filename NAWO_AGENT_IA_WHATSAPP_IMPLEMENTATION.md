# NAWO — Agent IA WhatsApp

## 1. Objectif

Permettre à un acheteur d'acheter un billet, de retrouver son billet et d'obtenir des
informations sur un événement directement dans WhatsApp, et à un organisateur de suivre
ses ventes par message.

## 2. Architecture

```text
WhatsApp Cloud API  →  webhook NAWO  →  moteur IA (intentions)  →  logique métier existante
                                                        ↓
                                          réponse texte + lien billet / QR
```

- Webhook public, vérifié par signature, exposé sur `/api/public/whatsapp`.
- Le moteur IA classe le message en intention puis appelle la logique métier déjà présente
  (recherche d'événement, création de commande, récupération de billet).
- Aucune donnée sensible (clé, mot de passe) n'est renvoyée dans la conversation.

## 3. Intentions gérées

| Intention | Exemple | Action |
| --- | --- | --- |
| `search_event` | « quels événements ce week-end ? » | liste des événements publiés |
| `event_info` | « c'est où Chill Masqué ? » | date, lieu, journées, tarifs |
| `buy_ticket` | « je veux 1 VIP » | collecte nom + email, crée la commande, renvoie le lien du billet |
| `my_ticket` | « retrouve mon billet » | recherche par email/téléphone, renvoie le lien |
| `promo` | « j'ai un code » | applique le code promo |
| `organizer_stats` | « mes ventes » | réservé à un numéro vérifié d'organisateur |
| `human` | « parler à quelqu'un » | transfert vers le support |

## 4. Données à ajouter

- `whatsapp_contacts` : `phone`, `user_id` (optionnel), `last_seen_at`.
- `whatsapp_sessions` : `phone`, `state` (json de la conversation en cours), `expires_at`.
- `whatsapp_messages` : journal entrant/sortant pour audit et debug.

L'état de conversation doit être persisté en base : le serveur est sans mémoire.

## 5. Flux d'achat conversationnel

1. L'utilisateur nomme un événement → l'agent propose les tarifs et les journées.
2. L'agent demande prénom, nom, email (validation stricte).
3. Récapitulatif : tarif, journées, remise éventuelle, total.
4. Confirmation explicite (« OUI ») avant toute création de commande.
5. Création via la même logique serveur que le site, puis envoi du lien du billet et du QR.
6. Toute erreur renvoie un message clair sans détail technique.

## 6. Sécurité

- Vérifier la signature du webhook avant tout traitement.
- Limiter le débit par numéro (anti-spam) et journaliser les tentatives.
- Les statistiques organisateur exigent un numéro lié à un compte vérifié par code à usage unique.
- Ne jamais afficher un QR ou un lien de billet à un numéro qui n'est pas l'acheteur.
- Conserver les messages 90 jours maximum.

## 7. Ton et langue

Français par défaut, réponses courtes, une question à la fois, emojis limités,
toujours proposer l'étape suivante.

## 8. Étapes de mise en œuvre

1. Compte WhatsApp Business + numéro vérifié, jeton permanent.
2. Webhook de vérification et de réception.
3. Tables de conversation et journal.
4. Classification des intentions via le service IA.
5. Branchement sur la logique billetterie existante.
6. Tests : achat complet, billet retrouvé, code promo, refus d'accès non autorisé.
7. Mise en production progressive sur un événement pilote.
