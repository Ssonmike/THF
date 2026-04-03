# THF Operations

## Security baseline
- Do **not** expose THF directly to the internet without auth in front.
- If used remotely, put it behind:
  - Tailscale, or
  - reverse proxy auth / SSO / basic auth.
- THF stores personal nutrition and health-adjacent data.

## Environment variables
- `DATABASE_URL`
- `ANTHROPIC_API_KEY` (required for nutrition generation)
- `NODE_ENV`
- `NEXT_TELEMETRY_DISABLED`

## Runtime modes
### Dev
- DB: `prisma/dev.db`
- Start with `npm run dev`

### Docker / production-like
- DB: `./data/prod.db`
- Start with `docker compose up -d`

## Backup / restore
### Important
SQLite file copies are safest when the app is stopped or no writes are happening.

### Backup
```bash
node scripts/backup.js
```

### Restore
```bash
node scripts/restore.js ./backups/thf-backup-YYYY-MM-DDTHH-MM-SS.db
```

## Operational checks
- confirm app is reachable
- confirm DB file exists where expected
- confirm backups are being created
- periodically test a restore, not just backup creation

## Nutrition feature
- Requires `ANTHROPIC_API_KEY`
- Current implementation depends on LLM output shape and parsing heuristics
- Treat this area as the most fragile part of THF


## Nutrition cleanup tools
- Dry-run sanitation of auto-generated nutrition recipes:
  ```bash
  node scripts/sanitize-nutrition-recipes.js --dry-run
  ```
- Apply sanitation:
  ```bash
  node scripts/sanitize-nutrition-recipes.js
  ```
- One-off manual repair for the two historically bad generated recipes:
  ```bash
  node scripts/fix-two-bad-nutrition-recipes.js
  ```
- Rebuild experiment for malformed generated recipes (keep as maintenance/debug tool):
  ```bash
  node scripts/rebuild-bad-nutrition-recipes.js --dry-run
  ```

