# Operations Manual Source Folder

Place source files here before running ingestion:

- `blades/`
- `pre_assembly_installation/`
- `service_maintenance/`
- `hr/`
- `about_swire_renewable/`
- `general/`

Supported input formats: `.txt`, `.md`, `.json`, `.csv`, `.log`, `.pdf`

Run ingestion:

```bash
docker compose --profile ingest run --rm data-ingest
```
