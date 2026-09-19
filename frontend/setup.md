# Setup frontend

## Développement local

Le frontend utilise Node.js et npm. Depuis ce dossier, installer les dépendances :

```bash
npm ci
```

Créer le fichier local à partir de l'exemple :

```bash
cp .env.example .env.local
```

Pour le développement local, laisser `VITE_API_URL` vide. Le proxy défini dans [`vite.config.ts`](./vite.config.ts) envoie automatiquement les requêtes vers `http://127.0.0.1:8000`.

Démarrer le serveur frontend :

```bash
npm run dev
```

L'adresse frontend locale est `http://127.0.0.1:3000`.

Le backend doit être démarré séparément. Voir le [setup backend](../backend/setup.md).

## Vérifications

```bash
npm run lint
npm run typecheck
npm run build
```
