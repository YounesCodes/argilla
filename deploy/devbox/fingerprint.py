"""Read-only canonical hashes of the review database, run on the devbox."""
import hashlib
import json
import subprocess

BASE = ["sudo", "docker", "compose", "exec", "-T", "postgres", "psql", "-U", "postgres", "-d", "argilla", "-Atc"]

def query(sql):
    return subprocess.check_output(BASE + [sql])

tables = query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename").decode().splitlines()
result = {}
for table in tables:
    quoted = '"' + table.replace('"', '""') + '"'
    rows = query(f"COPY (SELECT row_to_json(t)::text AS row FROM {quoted} t ORDER BY row_to_json(t)::text) TO STDOUT")
    result[table] = {"count": int(query(f"SELECT count(*) FROM {quoted}")), "sha256": hashlib.sha256(rows).hexdigest()}
print(json.dumps(result, indent=2, sort_keys=True))
