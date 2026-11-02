#!/usr/bin/env bash
set -euo pipefail
cd /opt/argilla
image=${1:?Pass the tested local image tag}
backup=$(cat /tmp/argilla-ui-backup-path)
test -s "$backup/argilla.dump"
sudo docker image inspect "$image" > "$backup/new-image.json"
# Capture again immediately before switching so recent reviews are included.
python3 /tmp/argilla-ui-fingerprint.py > "$backup/before-deploy.json"
cp compose.override.yaml "$backup/override-before-deploy.yaml"
rollback() {
  sudo cp "$backup/override-before-deploy.yaml" compose.override.yaml
  sudo docker compose up -d --no-deps --pull never --no-build argilla
}
trap rollback ERR
python3 - "$image" <<'PY' > /tmp/argilla-ui-override.json
import json, sys
from pathlib import Path
config = json.loads(Path('compose.override.yaml').read_text())
config['services']['argilla']['image'] = sys.argv[1]
print(json.dumps(config, indent=2))
PY
sudo install -m 644 /tmp/argilla-ui-override.json compose.override.yaml
sudo docker compose up -d --no-deps --pull never --no-build argilla
for attempt in $(seq 1 30); do
  if curl --fail --silent http://192.168.100.202:6900/ > /dev/null; then break; fi
  sleep 2
done
python3 /tmp/argilla-ui-verify.py
trap - ERR
printf 'Deployed %s; backup and verification: %s\n' "$image" "$backup"
