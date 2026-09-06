# Installation et démarrage en développement

Ce projet est composé de trois éléments utilisés en local :

- le frontend dans [`frontend/`](./frontend/) ;
- l'API Laravel dans [`backend/`](./backend/) ;
- MySQL lancé par Docker Compose depuis la racine.

## Démarrage local

Installer et configurer chaque application en suivant son guide :

- [Configuration du frontend](./frontend/setup.md)
- [Configuration du backend](./backend/setup.md)

Le démarrage complet se fait dans trois terminaux.

Dans le premier terminal, depuis la racine du projet, démarrer MySQL :

```bash
docker compose up -d mysql
```

Dans le deuxième terminal, démarrer l'API :

```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

Dans le troisième terminal, démarrer le frontend :

```bash
cd frontend
npm run dev
```

Le frontend utilise le proxy Vite pour envoyer `/api`, `/sanctum` et `/storage` vers l'API Laravel sur le port `8000`.

Pour arrêter MySQL depuis la racine :

```bash
docker compose down
```
