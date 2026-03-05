# Swire Department KB Runbook

## What this does
This workflow builds policy seed documents per department from:
- Public Swire Renewable web pages (`https://swire-re.com/base-sitemap.xml`)
- Known framework references (GWO, ISO, IEC, governance standards)

Then it ingests the generated documents into:
- Azure Blob Storage (`operations-manuals`)
- Azure AI Search (`swire-operations-index`)

## Department coverage
- Blades
- Pre-Assembly & Installation
- Service & Maintenance
- HR
- About Swire Renewable
- General

## One-time CLI setup (recommended)
```bash
./scripts/swire_setup_cli.sh
```

This script:
- Validates or creates Search and Storage resources in the target RG
- Creates the Blob container
- Creates the Foundry agent `swire-ops-hr-agent` if missing
- Generates `.env.azure.local` with working endpoints/keys

## One-command KB refresh (recommended)
```bash
./scripts/swire_refresh_kb_cli.sh
```

## Generate KB seeds
```bash
python3 scraper/build_department_kb.py
```

Generated files:
- `enterprise-data/<department>/policy_kb_seed.md`
- `enterprise-data/kb_manifest.json`

## Ingest to Azure Search + Blob
```bash
source .env.azure.local
source .venv/bin/activate
python swire-agent-core/ingest_operations_data.py --create-index
```

## Verify sample search
```bash
source .venv/bin/activate
python - <<'PY'
from pathlib import Path
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
vals={}
for line in Path('.env').read_text().splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k,v=line.split('=',1); vals[k.strip()]=v.strip()
client=SearchClient(endpoint=vals['AZURE_SEARCH_ENDPOINT'],index_name=vals.get('AZURE_SEARCH_INDEX','swire-operations-index'),credential=AzureKeyCredential(vals['AZURE_SEARCH_KEY']))
results=client.search(search_text='blade repair policy', top=5)
for r in results:
    print(r.get('title'), r.get('department'), r.get('chunk'))
PY
```

## Important note
These are seed policy packs. Treat as draft knowledge requiring internal legal/HSEQ/HR review before production policy publication.
