# ZeronERP — Implementation Plan

## Phase 1: Core Modules (Current)
### 1. Database Schema Expansion
- [ ] Add **Inventory** models: `Item`, `Warehouse`, `Stock`, `InventoryTransaction`.
- [ ] Add **Procurement** models: `Vendor`, `PurchaseOrder`, `PurchaseOrderItem`.
- [ ] Implement soft-delete and audit hooks for new models.

### 2. Inventory Service Layer
- [ ] `inventory.service.ts`: CRUD for items and warehouses.
- [ ] `stock.service.ts`: Logic for stock movements (In, Out, Transfer).
- [ ] Integration with AI Service for stock predictions/insights.

### 3. Inventory UI/UX
- [ ] Item management dashboard.
- [ ] Warehouse/Location management.
- [ ] Stock adjustment forms.
- [ ] Transaction history view.

## Phase 2: Configuration & Terminology
- [ ] Implementation of `CustomFieldDefinition` logic.
- [ ] Terminology override system (e.g., change "Warehouse" to "Store" globally via tenant settings).

## Phase 3: Cloudflare Deployment & Edge Optimization
- [ ] **Next-on-Pages Migration**: Ensure all routes work with `@cloudflare/next-on-pages`.
- [ ] **Prisma Edge Adapter**: Transition to `@prisma/adapter-pg` with `connect()` or `Prisma Accelerate` for Cloudflare Workers compatibility.
- [ ] **R2 Integration**: Ensure `storage.service.ts` is fully tested with R2.

---

## Instructions for Cloudflare Deployment
You can deploy ZeronERP to Cloudflare once we finalize Phase 3. 
**Requirements:**
1. **Cloudflare Account**: With Pages and R2 enabled.
2. **Database**: Since Cloudflare Workers are serverless/edge, you'll need a connection pooler. Supabase provides this out-of-the-box (use the Transaction mode URL).
3. **Environment Variables**: All variables in `.env` must be added to the Cloudflare Pages dashboard.
