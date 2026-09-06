#!/usr/bin/env sh
set -eu

backup_dir="${1:-./backups}"
mkdir -p "$backup_dir"
backup_file="$backup_dir/nawo-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"

docker compose --env-file .env.production -f compose.production.yaml exec -T mysql sh -c \
  'exec mysqldump --single-transaction --no-tablespaces --routines --triggers -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  | gzip > "$backup_file"

gzip -t "$backup_file"
printf '%s\n' "$backup_file"
