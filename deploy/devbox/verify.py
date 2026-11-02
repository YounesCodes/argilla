"""Verify live HTTP reads and unchanged database content after an image switch."""
import json
from pathlib import Path
import subprocess
import urllib.request

backup = Path('/tmp/argilla-ui-backup-path').read_text().strip()
after = subprocess.check_output(['python3', '/tmp/argilla-ui-fingerprint.py'])
Path(backup, 'after.json').write_bytes(after)
before = json.loads(Path(backup, 'before-deploy.json').read_text())
current = json.loads(after)
assert current == before, 'Database fingerprints changed; inspect before-deploy.json and after.json'
container = json.loads(subprocess.check_output(['sudo', 'docker', 'inspect', 'argilla-argilla-1']))[0]
env = dict(value.split('=', 1) for value in container['Config']['Env'] if '=' in value)
binding = container['NetworkSettings']['Ports']['6900/tcp'][0]
base = f"http://{binding['HostIp']}:{binding['HostPort']}"

def get(path):
    req = urllib.request.Request(base + path, headers={'X-Argilla-Api-Key': env['API_KEY']})
    with urllib.request.urlopen(req, timeout=30) as response:
        assert response.status == 200
        return json.load(response)

status = get('/api/v1/status')
assert status['version'] == '2.8.0' and isinstance(status['search_engine'], dict)
datasets = get('/api/v1/me/datasets')['items']
assert len(datasets) == current['datasets']['count']
for dataset in datasets:
    prefix = '/api/v1/datasets/' + dataset['id']
    assert len(get(prefix + '/fields')['items']) > 0
    assert len(get(prefix + '/questions')['items']) > 0
    progress = get(prefix + '/progress')
    print('Dataset:', dataset['name'], 'progress:', json.dumps(progress))
print('PASS: all', len(current), 'database tables match exactly; authenticated status, datasets, fields, questions and progress return HTTP 200')
Path(backup, 'verification.txt').write_text('All database table hashes/counts identical. Authenticated read endpoints passed.\n')
