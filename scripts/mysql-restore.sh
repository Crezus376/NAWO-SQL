#!/usr/bin/env sh
set -eu

backup_file="${1:-}"
if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
  printf '%s\n' "Usage: $0 chemin/backup.sql.gz" >&2
  exit 1
fi
gzip -t "$backup_file"
printf '%s' "Tapez RESTAURER pour remplacer la base cible : "
read -r confirmation
[ "$confirmation" = "RESTAURER" ] || exit 1

gzip -dc "$backup_file" | docker compose --env-file .env.production -f compose.production.yaml exec -T mysql sh -c \
  'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
