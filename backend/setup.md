# Setup backend

## Développement local

Le backend est une application Laravel. Depuis ce dossier, installer les dépendances PHP :

```bash
composer install
```

Créer le fichier d'environnement local :

```bash
cp .env.example .env
```

Le fichier `.env.example` est configuré pour utiliser le MySQL de développement lancé par Compose à l'adresse `127.0.0.1:3307`.

Depuis la racine du projet, démarrer MySQL :

```bash
docker compose up -d mysql
```

Générer la clé Laravel, préparer la base et le stockage :

```bash
php artisan key:generate
php artisan migrate
php artisan storage:link
```

Démarrer l'API :

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

L'API est alors disponible sur `http://127.0.0.1:8000`.

Le frontend doit être démarré séparément. Voir le [setup frontend](../frontend/setup.md).

## Tests

```bash
php artisan test
```
