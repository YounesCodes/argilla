#!/usr/bin/env bash
set -euo pipefail
cd /opt/argilla
backup="/opt/argilla/backups/ui-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 700 "$backup"
cp docker-compose.yaml compose.override.yaml "$backup/"
sudo docker compose exec -T postgres pg_dump -U postgres -d argilla -Fc > "$backup/argilla.dump"
test -s "$backup/argilla.dump"
sudo docker compose exec -T postgres pg_restore --list < "$backup/argilla.dump" > "$backup/restore-list.txt"
python3 /tmp/argilla-ui-fingerprint.py > "$backup/before.json"
printf '%s\n' "$backup" > /tmp/argilla-ui-backup-path
cat "$backup/before.json"
printf 'Backup: %s\n' "$backup"
