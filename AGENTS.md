# Cloudflare D1 Database Standard Operating Procedure (SOP)

For **ANY** database operation, schema modification, or data manipulation, follow this workflow.

## Credentials

**`.env.local`** (gitignored) — Cloudflare API token only:

```env
CLOUDFLARE_API_TOKEN=your-token
```

Remote Wrangler commands load this via `scripts/run-with-env.mjs`.

**`JWT_SECRET`** — Cloudflare Worker secret only (not in repo):

```bash
npm run secrets:jwt
```

To rotate: run the same command again (generates a new secret; existing login tokens will stop working).

## Step 1: Update Schema
Edit `src/db/schema.ts` with your Drizzle table/column changes.

## Step 2: Generate Migration (optional)
```bash
npm run db:generate
```
Or write SQL manually in `drizzle/migrations/`.

## Step 3: Apply Migrations

**Remote (production):**
```bash
npm run db:migrate:remote
```

## Step 4: Seed Admin (first-time setup)
```bash
npm run db:seed-admin -- --remote --password yourpassword --name "Super Admin"
```

Super admin always signs in with username `super_admin`.

## Auth
Authentication uses D1 (`ApplicationUsers.passwordHash`) and JWT signed with `JWT_SECRET` (Cloudflare Worker secret). Users sign in with `username`, not email.
