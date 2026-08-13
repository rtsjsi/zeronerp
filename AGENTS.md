# ZeronERP — Agent Briefing

Read this before changing anything. This is a live multi-store ERP, not a greenfield Next.js app.

## Product

Indian multi-store ERP PWA (oil-crushing vertical is the seeded demo: seeds `KGM` → oils `LTR`). GST-aware partners and invoice lines. Each tenant is a **Store**.

**Built:** Dashboard, Inventory, Production (recipes + declare batch), Purchase (payable invoices), Sales (invoices + Express POS), Admin users, Super-admin stores.

**Placeholders only (do not fake features):** `/reports`, `/settings`. `Stores.aiEnabled` exists; no AI is wired.

**Removed forever (do not bring back):** sales/purchase **orders**, item **SKU**, warehouse **code**, item **description**, **notes** on invoices/recipes/batches.

## Stack

- Next.js 16 App Router + React 19, Node `>=22`
- Deploy: OpenNext → Cloudflare Worker **`zeronerp`**
- DB: Cloudflare D1 **`zeronerpdb`** (binding `DB`), Drizzle ORM (`src/db/schema.ts`)
- Auth: D1 password hash + JWT (`jose`), username not email
- UI: shadcn base-nova / `@base-ui/react`, Tailwind 4, TanStack Query, react-hook-form + Zod 4, sonner

## Resume a machine

1. Clone `https://github.com/rtsjsi/zeronerp.git`
2. Restore **`.env.local`** (Cloudflare API token only). Template: `.env.local.example`. Do not commit it. A copy lives on Google Drive.
3. `npm install` then `npm run dev`
4. Do **not** run `npm run secrets:jwt` unless rotating — that invalidates all logins. `JWT_SECRET` is already on the Worker.

`.env.local` has `CLOUDFLARE_API_TOKEN` only. `JWT_SECRET` is a Worker secret, never a repo/env file.

## Database SOP (mandatory)

Any schema or data change:

1. Edit `src/db/schema.ts` (Drizzle is source of truth).
2. `npm run db:generate` **or** write SQL in `drizzle/migrations/`.
3. Apply: `npm run db:migrate:remote` (production) / `npm run db:migrate:local` (local D1).
4. First-time admin only: `npm run db:seed-admin -- --remote --password … --name "Super Admin"`

Remote Wrangler commands load `.env.local` via `scripts/run-with-env.mjs`.

**Seed (CLI only — no in-app seed APIs):** after a store exists, optional demo data: `db:seed-fg-items` → `db:seed-rm-items` → `db:seed-sample-recipes` → `db:seed-partners`. Idempotent by item/partner name. Catalogs: `src/lib/inventory/*.json`.

`seed-rm-items.mjs` still inserts UOM `'kg'`; migration `0012` normalizes to `KGM`. New app writes must use `KGM` via `normalizeUomCode()`.

## Auth and tenancy

| Role | Username | Store |
|------|----------|--------|
| `SUPER_ADMIN` | always `super_admin` | `storeId` NULL; pick store via cookie `zeron_superadmin_store_id` |
| `ADMIN` | per store | own `storeId` |
| `USER` | per store | own `storeId` |

- Sign-in: `{ username, password }` → JWT in `localStorage` key `zeron_auth_token`.
- APIs: wrap with `withAuth` (`src/lib/auth-middleware.ts`). Use **`ctx.storeId`**, never a client-supplied store id.
- Super admin without a selected store: only `/api/super-admin/*` and `/api/auth/me`. Operational APIs return 400 “Store context required”.
- Admin user APIs require `ADMIN` or `SUPER_ADMIN`. Store-admin create-user always role `USER`. Super-admin username cannot be anything except `super_admin`.
- No Next.js middleware auth. Dashboard layout is visual shell only; APIs enforce auth.

## Where code goes

```
src/db/schema.ts              tables + relations
src/db/helpers.ts             newId(), now(), withTimestamps(), JSON
src/lib/services/*.ts         business logic (Inventory, Stock, Recipe, Production, Procurement, Sales, SuperAdmin)
src/app/api/**/route.ts       thin handlers: withAuth, Zod, apiSuccess/apiError
src/app/(dashboard)/          client pages (useQuery + apiFetch + dialogs)
src/components/<module>/      tables + create/edit dialogs
src/components/shared/        TabToolbar, PageToolbar, EmptyState, ItemSelect, LovSelect
src/lib/inventory/            UOM + item Zod schemas
src/lib/invoice-amounts.ts    qty × unitPrice
src/lib/partner-schema.ts     PAN / GSTIN
```

SQL table names are PascalCase (`Item`, `PurchaseInvoice`). Drizzle exports are camelCase (`items`, `purchaseInvoices`). IDs are UUIDs. Timestamps are ISO strings. Soft-delete: set `isDeleted = true` and always filter `isDeleted = false`.

## Domain rules

**UOM** — store exactly 3 uppercase chars (`KGM`, `LTR`, `PCS`, …). Never persist `kg` / `l`. Use `UOM_OPTIONS` / `normalizeUomCode()` in `src/lib/inventory/constants.ts`.

**Items** — categories: `RAW_MATERIAL` | `FINISHED_GOODS` | `CONSUMABLES` | `SERVICES`. Types: `STOCKABLE` | `NON_STOCKABLE`. Identify by **name**, not SKU. Optional HSN/SAC: 4–8 digits. Stock views are stockable items only.

**Warehouses** — `name` + optional `location` only.

**Stock** — mutations go through `StockService` (adjust / transfer) and write `InventoryTransaction` (`IN` / `OUT`). Purchase invoices increase stock; sales decrease; declare production consumes RM and adds FG. Editing a purchase invoice reverses old lines then applies new ones.

**Production** — declare (`POST /api/production/declare`) requires an **active recipe** per finished good. Batch is created as `COMPLETED` (no DRAFT workflow in UI). Recipe name defaults to finished-good name; line updates delete-all + re-insert.

**Invoices** — Indian FY April–March, string `YYYY-YY` (e.g. `2025-26`).
- Line amount and `totalAmount` = **quantity × unitPrice** (GST excluded). Use `invoiceLineAmount` / `sumInvoiceLineAmounts`.
- `gstRate` is stored per line and shown as “GST (reference)” in UI; **do not add GST into `totalAmount`**.
- Sales unique: `(storeId, invoiceNumber, financialYear)`. Purchase unique: `(storeId, vendorId, invoiceNumber, financialYear)`.
- Sales walk-in: auto-create customer named `Walk-in Customer` when `customerId` omitted/`walkin`.
- UI labels: Purchase = “Payable / Supplier Invoice”; route is `/procurement`.

**Partners** — PAN `AAAAA9999A`, GSTIN 15 chars; uppercase on save (`partner-schema.ts`). Unique name per store.

## API / UI conventions

Envelope every route: `{ success, data, message, errors, pagination }` via `apiSuccess` / `apiError`. Client: `apiFetch` from `@/lib/api-client` (attaches Bearer token).

Most API routes: `export const dynamic = "force-dynamic"`.

Dashboard pages are `"use client"`: `useQuery` + sonner toasts + shadcn `Dialog`/`Tabs`. Match existing table + dialog patterns; do not invent a new CRUD style. Disable mouse-wheel on number inputs (already done on invoice qty/price).

Nav: desktop sidebar (Dashboard, Inventory, Production, Purchase `/procurement`, Sales, Reports). Mobile bottom nav: Home, Inventory, Purchase, Sales, More (Production, Reports, Settings). Super admin sees operational nav only after selecting a store.

## Do not

- Put `JWT_SECRET` in `.env.local` or the repo
- Trust `storeId` or `role` from the client body
- Reintroduce SKU, warehouse code, notes, orders, Gujarati item names, or Supabase
- Add in-app seed API routes (use `scripts/*.mjs`)
- Create a second super admin or rename `super_admin`
- “Fix” currency display as a drive-by (see below)
- Expand Reports/Settings unless that is the task

## Known inconsistency

`src/lib/format.ts` comments say amounts are **paise** and `formatCurrency` divides by 100. D1 columns are `real` rupee decimals (`cost`, `mrp`, `unitPrice`, `totalAmount`). Display currently uses `formatCurrency` as-is. If you change money storage or display, treat that as a dedicated fix — do not mix paise and rupees in new code.

## Commands

```bash
npm run dev
npm run deploy                          # OpenNext build + deploy worker zeronerp
npm run db:generate
npm run db:migrate:remote
npm run db:seed-admin -- --remote --password PASS --name "Super Admin"
npm run db:reset-admin -- --password NEWPASS
npm run secrets:jwt                     # rotate only
```
