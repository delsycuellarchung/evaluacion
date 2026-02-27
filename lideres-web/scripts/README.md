Scripts to preserve upload order and assign row_index

1) Migration SQL

File: scripts/migrations/001_add_row_index_and_import_batch.sql

Run this on your Postgres DB (supabase) with a user that has ALTER rights. Example using psql or Supabase SQL editor:

psql "postgres://<user>:<pass>@<host>:5432/<db>" -c "\i scripts/migrations/001_add_row_index_and_import_batch.sql"

Or paste the SQL contents into Supabase SQL editor and run.

2) Assign row_index to existing rows

File: scripts/assign_row_index.js

Purpose: after adding the columns, this script assigns sequential `row_index` values grouped by `import_batch` (NULL values are grouped together). It attempts to preserve the current order returned by the DB for each group.

Environment variables required:
- SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
- SUPABASE_SERVICE_KEY (recommended; service_role key to allow writes)

Optional:
- DRY_RUN=true  -> only prints planned updates without modifying DB

Run example (Windows PowerShell):

$env:SUPABASE_URL = "https://xyz.supabase.co"
$env:SUPABASE_SERVICE_KEY = "your-service-role-key"
node .\\scripts\\assign_row_index.js

Or (Linux / macOS):

SUPABASE_URL=https://xyz.supabase.co SUPABASE_SERVICE_KEY=your-key node scripts/assign_row_index.js

3) Notes & next steps
- The import code now writes `row_index` and `import_batch` when importing via the admin paste UI. New imports will have correct `row_index` values automatically.
- The UI code (ModalSendForms, datos-importados, enviar-formulario) attempts to order by `row_index` when loading evaluators; the SQL index speeds up those queries.
- If you want, I can also provide a small migration that backfills `import_batch` based on patterns (not implemented here).
