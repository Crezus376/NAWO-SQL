# NAWO: Event Ticketing Made Easy

Créer NAWO — Plateforme moderne de billetterie événementielle

Je veux que tu développes une application web complète appelée NAWO, une plateforme moderne de billetterie pour événements.

NAWO doit permettre à des organisateurs de créer et gérer leurs événements très simplement, tandis que les participants peuvent découvrir les événements, acheter un billet rapidement et recevoir un billet avec un QR code unique.

L'objectif principal est la simplicité.

NAWO ne doit pas ressembler à un logiciel complexe de gestion d'événements. L'interface doit être moderne, élégante, intuitive et très facile à comprendre.

1. IDENTITÉ VISUELLE

La marque s'appelle NAWO.

Couleurs principales :

Violet : couleur principale de la marque

Rose : couleur secondaire / accent

Blanc : arrière-plans et espaces

Noir / gris très foncé : textes

Gris clair : bordures, fonds secondaires

Créer une identité visuelle moderne autour d'un dégradé subtil violet → rose lorsque cela apporte de la valeur.

Le design doit être :

premium ;

moderne ;

minimaliste ;

élégant ;

responsive ;

mobile-first ;

avec de beaux espaces blancs ;

avec des cartes légèrement arrondies ;

avec des animations discrètes ;

avec une excellente hiérarchie visuelle.

Éviter les interfaces surchargées.

NAWO doit donner l'impression d'un produit SaaS moderne et professionnel.

2. STRUCTURE GÉNÉRALE

L'application comporte trois grands espaces :

Site public NAWO

Espace organisateur

Espace administration NAWO

Le système doit également prévoir une interface dédiée aux agents/hôtesses chargés du scan des billets.

3. SITE PUBLIC NAWO

Créer une page d'accueil publique très simple.

L'objectif est de présenter les événements actuellement pris en charge par NAWO.

La page doit contenir :

logo NAWO ;

navigation simple ;

une courte présentation ;

une section "Événements" ;

cartes des événements disponibles ;

image de l'événement ;

nom ;

date ;

lieu ;

bouton "Voir l'événement".

Créer également une navigation permettant à un organisateur d'accéder à :

Connexion

Créer un compte

Ne pas transformer la page d'accueil en marketplace complexe.

4. PAGE D'UN ÉVÉNEMENT

Chaque événement possède une URL unique du type :

/e/nom-de-evenement

La page peut fonctionner selon deux modes :

MODE STANDARD

La page est générée automatiquement par NAWO.

Elle affiche :

affiche de l'événement ;

nom ;

date ;

heure ;

lieu ;

description ;

types de billets ;

prix ;

disponibilité ;

bouton d'achat.

Le design doit être propre et cohérent avec l'identité NAWO.

MODE PERSONNALISÉ

Un événement peut avoir une page conçue spécialement par l'équipe NAWO.

La structure de données doit donc prévoir un champ permettant de différencier :

standard

custom

Une page personnalisée doit pouvoir utiliser sa propre identité visuelle et sa propre mise en page tout en restant connectée au système de billetterie NAWO.

IMPORTANT :

La personnalisation de la page est un service payant.

La personnalisation des billets n'est PAS un service premium.

5. INSCRIPTION ORGANISATEUR

Créer une inscription extrêmement simple.

L'organisateur renseigne uniquement :

Email

Mot de passe

Après inscription, envoyer un email de vérification.

L'organisateur doit vérifier son adresse email avant d'utiliser pleinement son compte.

Prévoir :

connexion ;

déconnexion ;

récupération du mot de passe ;

réinitialisation du mot de passe.

Ne pas demander un long formulaire d'inscription.

6. DASHBOARD ORGANISATEUR

Créer un dashboard très simple.

L'organisateur doit voir ses événements sous forme de cartes.

Chaque carte affiche :

image ;

nom de l'événement ;

date ;

statut ;

nombre de billets vendus ;

bouton "Gérer".

Ajouter un bouton principal :

+ Créer un événement

L'organisateur peut créer plusieurs événements.

7. CRÉATION D'UN ÉVÉNEMENT

Le processus doit être très simple.

Informations demandées :

Nom de l'événement

Date

Heure

Lieu

Description

Image / affiche de l'événement

Après ces informations, demander :

"Comment souhaitez-vous présenter votre événement ?"

Deux choix :

Page standard

Gratuite.

Page personnalisée

Service payant réalisé par l'équipe NAWO.

8. PAGE STANDARD

Si l'organisateur choisit "Page standard" :

Le système génère automatiquement sa page événement.

Exemple :

/e/chill-masking

La page devient immédiatement disponible selon le statut de l'événement.

Aucun travail manuel de design n'est nécessaire.

9. PAGE PERSONNALISÉE

Si l'organisateur choisit "Page personnalisée" :

Afficher clairement qu'il s'agit d'un service payant.

L'organisateur fournit notamment :

affiche de l'événement ;

informations nécessaires à la conception.

Créer un système de demande de page personnalisée.

Prévoir les statuts :

pending

in_progress

ready_for_preview

awaiting_payment

paid

active

revision_requested

L'équipe NAWO pourra préparer la page.

Une fois la page prête, l'organisateur peut voir une prévisualisation.

La page personnalisée ne doit être activée publiquement qu'après validation et confirmation du paiement requis.

10. GESTION DES BILLETS

Chaque événement peut avoir plusieurs types de billets.

Exemples :

Participant

VIP

Support

Early Bird

Premium

Pour chaque type de billet, permettre de définir :

nom ;

prix ;

quantité disponible ;

description facultative ;

image du billet facultative au moment de la création.

IMPORTANT :

L'organisateur n'est pas obligé d'avoir immédiatement l'image de son billet.

Il peut créer l'événement et les billets, puis ajouter les images plus tard.

11. VISUELS DES BILLETS

L'organisateur peut envoyer une image pour chaque type de billet.

Exemple :

Participant → image du ticket Participant

VIP → image du ticket VIP

Support → image du ticket Support

Le système doit permettre d'ajouter ou modifier ces images ultérieurement.

IMPORTANT :

Cette fonctionnalité est disponible pour tous les événements.

Elle n'est PAS une fonctionnalité premium.

12. TEMPLATES DE BILLETS

Créer une structure permettant à NAWO de gérer les templates de billets.

Pour chaque template, prévoir :

événement ;

type de billet ;

image du billet ;

position X du QR code ;

position Y du QR code ;

largeur du QR code ;

hauteur du QR code ;

statut du template.

Les coordonnées du QR code seront configurées par l'équipe NAWO.

L'organisateur n'a pas besoin de connaître ces paramètres techniques.

Exemple :

Ticket VIP
Image : vip.png
QR X : 850
QR Y : 320
QR Width : 180
QR Height : 180


Le système doit être conçu pour permettre plus tard l'ajout d'autres éléments dynamiques tels que :

nom ;

prénom ;

numéro du billet ;

date ;

type de billet.

13. GÉNÉRATION DES BILLETS

Lorsqu'un participant achète un billet :

créer la commande ;

confirmer le paiement ;

créer le billet ;

générer un QR code unique ;

récupérer le template correspondant ;

utiliser l'image du billet ;

positionner le QR code selon les coordonnées configurées ;

générer le billet final ;

enregistrer le billet ;

permettre au participant de récupérer son billet.

Chaque billet doit avoir un QR code unique.

Un QR code ne peut être utilisé qu'une seule fois pour l'entrée.

14. ACHAT D'UN BILLET

Le parcours d'achat doit être extrêmement rapide.

Ne pas obliger le participant à créer un compte.

Le participant :

choisit son type de billet ;

renseigne son prénom ;

renseigne son nom ;

renseigne les informations nécessaires au paiement / à la réception du billet ;

renseigne éventuellement un code promo ;

paie ;

reçoit son billet.

IMPORTANT :

Un achat correspond à un seul billet.

Il n'y a pas de sélection de quantité de billets dans une même commande.

Si une personne veut plusieurs billets, elle réalise plusieurs achats.

15. PAIEMENT

Prévoir une architecture permettant l'intégration d'un système de paiement.

Le paiement doit être associé à une commande.

États possibles :

pending

paid

failed

cancelled

Un billet ne doit être considéré comme vendu que lorsque le paiement est confirmé.

La génération du billet doit être déclenchée après confirmation du paiement.

16. CODES PROMO

Permettre aux organisateurs de créer des codes promotionnels.

Un code peut contenir :

code ;

type de réduction ;

valeur de réduction ;

limite d'utilisation ;

date de début ;

date de fin ;

statut.

Le participant peut saisir le code lors de son achat.

Le système vérifie automatiquement sa validité.

17. DASHBOARD DES VENTES

Le dashboard doit rester minimaliste.

Pour chaque événement afficher :

Total des billets vendus

Exemple :

420 billets vendus

Ventes par type de billet

Participant : 300
VIP : 80
Support : 40


Revenus

Afficher éventuellement le montant total généré.

Ne pas créer une interface complexe de CRM.

18. DONNÉES DES PARTICIPANTS

Ne pas créer dans la V1 un système complexe de gestion des participants.

L'organisateur n'a pas besoin d'avoir un CRM complet.

Les données nécessaires sont conservées dans le système pour :

traitement des commandes ;

génération des billets ;

paiement ;

contrôle des tickets ;

statistiques nécessaires.

L'organisateur doit principalement voir les statistiques de ventes et non une grande base de données détaillée des participants.

19. AMBASSADEURS

Créer une fonctionnalité "Ambassadeurs".

L'organisateur peut créer un ambassadeur avec :

nom ;

objectif de vente.

Le système génère automatiquement un lien unique.

Exemple :

/e/chill-masking?ref=kevin

Les ventes réalisées via ce lien sont associées à l'ambassadeur.

Le dashboard affiche :

Kevin
Objectif : 50
Vendus : 37


L'ambassadeur ne doit pas avoir accès aux informations privées des acheteurs.

20. HÔTESSES / AGENTS DE SCAN

Créer une section permettant à l'organisateur de créer des comptes d'agents de scan.

Ces comptes doivent avoir des permissions limitées.

Un agent de scan ne doit pas accéder au dashboard complet de l'organisateur.

Il doit principalement pouvoir :

se connecter ;

scanner un billet ;

voir le résultat du scan ;

voir éventuellement le nombre de billets déjà scannés.

21. INTERFACE DE SCAN

Créer une interface mobile-first extrêmement simple.

Écran principal :

NAWO SCAN

[ Scanner un billet ]

Billets scannés : 127


Lorsqu'un QR code est scanné :

Billet valide

Afficher clairement :

✓ TICKET VALIDE

Puis :

type de billet ;

statut ;

entrée autorisée.

Billet déjà utilisé

Afficher :

✕ TICKET DÉJÀ UTILISÉ

L'entrée est refusée.

Billet invalide

Afficher :

✕ TICKET INVALIDE

22. ADMINISTRATION NAWO

Créer un espace administrateur séparé.

L'administrateur peut :

voir les organisateurs ;

voir les événements ;

gérer les événements ;

gérer les demandes de pages personnalisées ;

gérer les pages personnalisées ;

prévisualiser les pages ;

activer/désactiver une page personnalisée ;

gérer les templates de billets ;

configurer les positions des QR codes ;

voir les ventes ;

gérer les demandes de support ;

gérer les agents de scan.

23. GESTION DES TEMPLATES DE BILLETS PAR L'ADMIN

Créer une interface permettant à l'équipe NAWO de sélectionner :

événement ;

type de billet ;

image du ticket.

Puis configurer :

QR X
QR Y
QR Width
QR Height


Ajouter une prévisualisation du billet avec un QR fictif.

L'administrateur doit pouvoir déplacer/modifier les paramètres et vérifier visuellement le résultat avant de valider le template.

24. STATUTS DES ÉVÉNEMENTS

Prévoir plusieurs statuts :

Draft

Published

Ongoing

Completed

Cancelled

L'organisateur doit pouvoir enregistrer un événement sans le publier immédiatement.

25. EXPÉRIENCE MOBILE

La plateforme doit être parfaitement responsive.

Priorité particulière :

pages événement ;

achat ;

billet ;

dashboard ;

scanner.

Les participants utiliseront principalement leur téléphone.

Le billet doit être parfaitement lisible sur mobile.

L'interface de scan doit être optimisée pour les téléphones.

26. ARCHITECTURE DE L'INTERFACE

Créer les principales routes/pages suivantes :

Public

/
 /events
 /e/:slug
 /e/:slug/buy
 /payment/success
 /payment/failed
 /ticket/:id


Organisateur

/login
/register
/verify-email
/dashboard
/dashboard/events
/dashboard/events/create
/dashboard/events/:id
/dashboard/events/:id/edit
/dashboard/events/:id/tickets
/dashboard/events/:id/ambassadors
/dashboard/events/:id/hosts
/dashboard/events/:id/settings


Administration

/admin
/admin/events
/admin/organizers
/admin/custom-pages
/admin/ticket-templates
/admin/scans


Scan

/scan/login
/scan


27. MODÈLE DE DONNÉES À PRÉVOIR

Préparer une architecture de données pouvant gérer au minimum :

users
events
event_pages
ticket_types
ticket_templates
tickets
orders
payments
promo_codes
ambassadors
ambassador_sales
hosts
scans


Les relations doivent être propres et permettre à chaque organisateur de voir uniquement ses propres événements et données autorisées.

28. SÉCURITÉ ET PERMISSIONS

Prévoir actuellement deux rôles :




organizer ;

admin.

Les agents de scan (`host`) seront traités séparément dans une prochaine étape.
Un organisateur ne peut accéder qu'à ses propres événements.

Une hôtesse ne peut accéder qu'aux fonctionnalités de scan qui lui sont autorisées.

Un administrateur dispose des droits de gestion de la plateforme.

Les QR codes doivent être difficiles à falsifier et chaque billet doit être identifié de manière unique.

29. PRINCIPES UX À RESPECTER

Le produit doit respecter les règles suivantes :

Pour l'organisateur

Créer → Configurer → Publier → Vendre → Scanner

Pour le participant

Voir → Choisir → Payer → Recevoir → Présenter

Ne pas multiplier les étapes.

Ne pas demander d'informations inutiles.

Ne pas créer de fonctionnalités complexes qui ne sont pas nécessaires au fonctionnement de la billetterie.

30. CE QUI N'EST PAS À FAIRE DANS CETTE VERSION

Ne pas ajouter :

réseau social ;

messagerie entre participants ;

système complexe de communauté ;

CRM avancé ;

marketplace complexe ;

gestion comptable avancée ;

gestion complexe des participants ;

système de réservation de tables ;

programme de fidélité ;

fonctionnalités inutiles de gestion d'événements.

NAWO doit rester simple, rapide et spécialisé dans la billetterie événementielle.

31. ÉVOLUTION FUTURE

Préparer l'architecture afin de pouvoir ajouter plus tard un agent IA WhatsApp, mais ne pas développer cette fonctionnalité maintenant.

À terme, l'agent pourra permettre :

création d'événement par conversation ;

modification d'événement ;

consultation des ventes ;

achat de billets ;

réception d'informations ;

interaction avec les fonctionnalités NAWO.

IMPORTANT :

Cette fonctionnalité est uniquement une évolution future. Elle ne doit pas être développée dans cette première version.

32. RÉSULTAT ATTENDU

Je veux obtenir une première version complète et fonctionnelle de NAWO avec :

une landing page moderne ;

une liste d'événements ;

des pages événement standard ;

la structure nécessaire aux pages personnalisées ;

inscription et connexion organisateur ;

vérification email ;

dashboard organisateur ;

création d'événements ;

gestion de plusieurs événements ;

gestion des types de billets ;

ajout des visuels de billets ;

système de templates de billets ;

génération de QR codes ;

système de commandes ;

intégration prête pour le paiement ;

codes promo ;

statistiques simples ;

ambassadeurs ;

agents de scan ;

validation des QR codes ;

espace administrateur ;

gestion des pages personnalisées ;

gestion des templates de tickets.

Le résultat doit être propre, cohérent, moderne, responsive et réellement utilisable, et non une simple maquette visuelle.

L'interface doit donner immédiatement l'impression que NAWO est une vraie plateforme SaaS de billetterie professionnelle.

Le design doit utiliser principalement violet et rose, avec une esthétique premium mais simple.

Ne pas surcharger l'application avec des fonctionnalités qui ne sont pas demandées.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/349fb1f3-c7b1-48a0-88fb-a7e028ca4f48).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitLab and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
cd frontend
npm i
npm run dev
```
