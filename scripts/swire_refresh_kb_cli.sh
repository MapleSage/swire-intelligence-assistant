#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-${ROOT_DIR}/.env.azure.local}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "Env file not found: $ENV_FILE"
  echo "Run scripts/swire_setup_cli.sh first (or set ENV_FILE)."
  exit 1
fi

cd "$ROOT_DIR"

if [[ -d .venv ]]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

echo "[1/3] Building department KB seed files..."
python3 scraper/build_department_kb.py

echo "[2/3] Ingesting enterprise-data into Blob + Search index..."
python3 swire-agent-core/ingest_operations_data.py --create-index

echo "[3/3] Smoke test: query Azure Search index"
python3 - <<'PY'
import os, requests

endpoint = os.environ['AZURE_SEARCH_ENDPOINT'].rstrip('/')
index_name = os.environ['AZURE_SEARCH_INDEX']
api_key = os.environ['AZURE_SEARCH_KEY']

url = f"{endpoint}/indexes/{index_name}/docs/search?api-version=2023-11-01"
payload = {
    "search": "blade repair policy",
    "top": 3,
    "select": "title,department,source"
}
res = requests.post(url, headers={"api-key": api_key, "Content-Type": "application/json"}, json=payload, timeout=30)
res.raise_for_status()
rows = res.json().get("value", [])
print(f"Search hits: {len(rows)}")
for i, r in enumerate(rows, 1):
    print(f"{i}. {r.get('title')} [{r.get('department')}]")
PY

echo "KB refresh complete."
