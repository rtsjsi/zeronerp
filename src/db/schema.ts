import { relations } from 'drizzle-orm';
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
};

const softDelete = {
  isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
};

export const stores = sqliteTable('Stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  settings: text('settings').notNull().default('{}'),
  aiEnabled: integer('aiEnabled', { mode: 'boolean' }).notNull().default(true),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
  address: text('address'),
  gstn: text('gstn'),
  contactNumber: text('contactNumber'),
  ...timestamps,
});

export const applicationUsers = sqliteTable(
  'ApplicationUsers',
  {
    id: text('id').primaryKey(),
    storeId: text('storeId').references(() => stores.id),
    username: text('username').notNull(),
    fullName: text('fullName').notNull(),
    passwordHash: text('passwordHash').notNull(),
    role: text('role').notNull().default('USER'),
    isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
    isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex('ApplicationUsers_storeId_username').on(table.storeId, table.username)],
);

export const items = sqliteTable(
  'Item',
  {
    id: text('id').primaryKey(),
    storeId: text('storeId').notNull().references(() => stores.id),
    name: text('name').notNull(),
    category: text('category').notNull().default('RAW_MATERIAL'),
    itemType: text('itemType').notNull().default('STOCKABLE'),
    uom: text('uom').notNull().default('PCS'),
    hsnSacCode: text('hsnSacCode'),
    gstRate: real('gstRate').notNull().default(0),
    reorderLevel: real('reorderLevel').notNull().default(0),
    minStock: real('minStock').notNull().default(0),
    cost: real('cost').notNull().default(0),
    mrp: real('mrp').notNull().default(0),
    isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
    isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
    createdBy: text('createdBy'),
    ...timestamps,
  },
);

export const warehouses = sqliteTable(
  'Warehouse',
  {
    id: text('id').primaryKey(),
    storeId: text('storeId').notNull().references(() => stores.id),
    name: text('name').notNull(),
    location: text('location'),
    isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
    createdBy: text('createdBy'),
    ...timestamps,
  },
  (table) => [uniqueIndex('Warehouse_storeId_name').on(table.storeId, table.name)],
);

export const stocks = sqliteTable(
  'Stock',
  {
    id: text('id').primaryKey(),
    storeId: text('storeId').notNull().references(() => stores.id),
    itemId: text('itemId').notNull().references(() => items.id),
    warehouseId: text('warehouseId').notNull().references(() => warehouses.id),
    quantity: real('quantity').notNull().default(0),
    updatedAt: text('updatedAt').notNull(),
  },
  (table) => [uniqueIndex('Stock_itemId_warehouseId').on(table.itemId, table.warehouseId)],
);

export const inventoryTransactions = sqliteTable('InventoryTransaction', {
  id: text('id').primaryKey(),
  storeId: text('storeId').notNull().references(() => stores.id),
  itemId: text('itemId').notNull().references(() => items.id),
  warehouseId: text('warehouseId').notNull().references(() => warehouses.id),
  type: text('type').notNull(),
  quantity: real('quantity').notNull(),
  reference: text('reference'),
  performedBy: text('performedBy'),
  createdAt: text('createdAt').notNull(),
});

export const vendors = sqliteTable(
  'Vendor',
  {
    id: text('id').primaryKey(),
    storeId: text('storeId').notNull().references(() => stores.id),
    name: text('name').notNull(),
    contactName: text('contactName'),
    email: text('email'),
    phone: text('phone'),
    address: text('address'),
    pan: text('pan'),
    gstn: text('gstn'),
    customFields: text('customFields').notNull().default('{}'),
    isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
    createdBy: text('createdBy'),
    ...timestamps,
  },
  (table) => [uniqueIndex('Vendor_storeId_name').on(table.storeId, table.name)],
);

export const customers = sqliteTable(
  'Customer',
  {
    id: text('id').primaryKey(),
    storeId: text('storeId').notNull().references(() => stores.id),
    name: text('name').notNull(),
    contactName: text('contactName'),
    email: text('email'),
    phone: text('phone'),
    address: text('address'),
    pan: text('pan'),
    gstn: text('gstn'),
    customFields: text('customFields').notNull().default('{}'),
    isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
    createdBy: text('createdBy'),
    ...timestamps,
  },
  (table) => [uniqueIndex('Customer_storeId_name').on(table.storeId, table.name)],
);

export const purchaseInvoices = sqliteTable(
  'PurchaseInvoice',
  {
    id: text('id').primaryKey(),
    storeId: text('storeId').notNull().references(() => stores.id),
    vendorId: text('vendorId').notNull().references(() => vendors.id),
    invoiceNumber: text('invoiceNumber').notNull(),
    invoiceDate: text('invoiceDate').notNull(),
    financialYear: text('financialYear').notNull(),
    status: text('status').notNull().default('COMPLETED'),
    totalAmount: real('totalAmount').notNull().default(0),
    isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
    createdBy: text('createdBy'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('PurchaseInvoice_store_vendor_number_year').on(
      table.storeId,
      table.vendorId,
      table.invoiceNumber,
      table.financialYear,
    ),
  ],
);

export const purchaseInvoiceItems = sqliteTable('PurchaseInvoiceItem', {
  id: text('id').primaryKey(),
  invoiceId: text('invoiceId').notNull().references(() => purchaseInvoices.id, { onDelete: 'cascade' }),
  itemId: text('itemId').notNull().references(() => items.id),
  warehouseId: text('warehouseId').notNull().references(() => warehouses.id),
  quantity: real('quantity').notNull(),
  unitPrice: real('unitPrice').notNull(),
  gstRate: real('gstRate').notNull().default(0),
  totalPrice: real('totalPrice').notNull(),
});

export const salesInvoices = sqliteTable(
  'SalesInvoice',
  {
    id: text('id').primaryKey(),
    storeId: text('storeId').notNull().references(() => stores.id),
    customerId: text('customerId').notNull().references(() => customers.id),
    invoiceNumber: text('invoiceNumber').notNull(),
    invoiceDate: text('invoiceDate').notNull(),
    financialYear: text('financialYear').notNull(),
    status: text('status').notNull().default('COMPLETED'),
    totalAmount: real('totalAmount').notNull().default(0),
    paymentMethod: text('paymentMethod').notNull().default('CASH'),
    amountReceived: real('amountReceived').notNull().default(0),
    amountReturned: real('amountReturned').notNull().default(0),
    isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
    createdBy: text('createdBy'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('SalesInvoice_store_number_year').on(
      table.storeId,
      table.invoiceNumber,
      table.financialYear,
    ),
  ],
);

export const salesInvoiceItems = sqliteTable('SalesInvoiceItem', {
  id: text('id').primaryKey(),
  invoiceId: text('invoiceId').notNull().references(() => salesInvoices.id, { onDelete: 'cascade' }),
  itemId: text('itemId').notNull().references(() => items.id),
  warehouseId: text('warehouseId').notNull().references(() => warehouses.id),
  quantity: real('quantity').notNull(),
  unitPrice: real('unitPrice').notNull(),
  gstRate: real('gstRate').notNull().default(0),
  totalPrice: real('totalPrice').notNull(),
});

export const recipes = sqliteTable('Recipe', {
  id: text('id').primaryKey(),
  storeId: text('storeId').notNull().references(() => stores.id),
  name: text('name').notNull(),
  finishedItemId: text('finishedItemId').notNull().references(() => items.id),
  outputQuantity: real('outputQuantity').notNull().default(1),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
  createdBy: text('createdBy'),
  ...timestamps,
});

export const recipeLines = sqliteTable('RecipeLine', {
  id: text('id').primaryKey(),
  storeId: text('storeId').notNull().references(() => stores.id),
  recipeId: text('recipeId').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  rawItemId: text('rawItemId').notNull().references(() => items.id),
  quantity: real('quantity').notNull(),
});

export const productionBatches = sqliteTable('ProductionBatch', {
  id: text('id').primaryKey(),
  storeId: text('storeId').notNull().references(() => stores.id),
  recipeId: text('recipeId').references(() => recipes.id),
  batchNumber: text('batchNumber').notNull(),
  status: text('status').notNull().default('DRAFT'),
  startTime: text('startTime'),
  endTime: text('endTime'),
  isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
  createdBy: text('createdBy'),
  ...timestamps,
});

export const productionOutputs = sqliteTable('ProductionOutput', {
  id: text('id').primaryKey(),
  storeId: text('storeId').notNull().references(() => stores.id),
  batchId: text('batchId').notNull().references(() => productionBatches.id, { onDelete: 'cascade' }),
  recipeId: text('recipeId').references(() => recipes.id),
  itemId: text('itemId').notNull().references(() => items.id),
  warehouseId: text('warehouseId').notNull().references(() => warehouses.id),
  quantity: real('quantity').notNull(),
  createdAt: text('createdAt').notNull(),
});

export const productionMaterials = sqliteTable('ProductionMaterial', {
  id: text('id').primaryKey(),
  storeId: text('storeId').notNull().references(() => stores.id),
  batchId: text('batchId').notNull().references(() => productionBatches.id, { onDelete: 'cascade' }),
  outputLineId: text('outputLineId').references(() => productionOutputs.id, { onDelete: 'cascade' }),
  itemId: text('itemId').notNull().references(() => items.id),
  warehouseId: text('warehouseId').notNull().references(() => warehouses.id),
  type: text('type').notNull(),
  quantity: real('quantity').notNull(),
  createdAt: text('createdAt').notNull(),
});

export const storesRelations = relations(stores, ({ many }) => ({
  users: many(applicationUsers),
  items: many(items),
  warehouses: many(warehouses),
}));

export const itemsRelations = relations(items, ({ many }) => ({
  stocks: many(stocks),
}));

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  stocks: many(stocks),
}));

export const stocksRelations = relations(stocks, ({ one }) => ({
  item: one(items, { fields: [stocks.itemId], references: [items.id] }),
  warehouse: one(warehouses, { fields: [stocks.warehouseId], references: [warehouses.id] }),
}));

export const purchaseInvoicesRelations = relations(purchaseInvoices, ({ one, many }) => ({
  vendor: one(vendors, { fields: [purchaseInvoices.vendorId], references: [vendors.id] }),
  items: many(purchaseInvoiceItems),
}));

export const purchaseInvoiceItemsRelations = relations(purchaseInvoiceItems, ({ one }) => ({
  invoice: one(purchaseInvoices, { fields: [purchaseInvoiceItems.invoiceId], references: [purchaseInvoices.id] }),
  item: one(items, { fields: [purchaseInvoiceItems.itemId], references: [items.id] }),
  warehouse: one(warehouses, { fields: [purchaseInvoiceItems.warehouseId], references: [warehouses.id] }),
}));

export const salesInvoicesRelations = relations(salesInvoices, ({ one, many }) => ({
  customer: one(customers, { fields: [salesInvoices.customerId], references: [customers.id] }),
  items: many(salesInvoiceItems),
}));

export const salesInvoiceItemsRelations = relations(salesInvoiceItems, ({ one }) => ({
  invoice: one(salesInvoices, { fields: [salesInvoiceItems.invoiceId], references: [salesInvoices.id] }),
  item: one(items, { fields: [salesInvoiceItems.itemId], references: [items.id] }),
  warehouse: one(warehouses, { fields: [salesInvoiceItems.warehouseId], references: [warehouses.id] }),
}));

export const productionBatchesRelations = relations(productionBatches, ({ one, many }) => ({
  recipe: one(recipes, { fields: [productionBatches.recipeId], references: [recipes.id] }),
  outputs: many(productionOutputs),
  materials: many(productionMaterials),
}));

export const productionOutputsRelations = relations(productionOutputs, ({ one, many }) => ({
  batch: one(productionBatches, { fields: [productionOutputs.batchId], references: [productionBatches.id] }),
  recipe: one(recipes, { fields: [productionOutputs.recipeId], references: [recipes.id] }),
  item: one(items, { fields: [productionOutputs.itemId], references: [items.id] }),
  warehouse: one(warehouses, { fields: [productionOutputs.warehouseId], references: [warehouses.id] }),
  materials: many(productionMaterials),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  finishedItem: one(items, { fields: [recipes.finishedItemId], references: [items.id] }),
  lines: many(recipeLines),
}));

export const recipeLinesRelations = relations(recipeLines, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeLines.recipeId], references: [recipes.id] }),
  rawItem: one(items, { fields: [recipeLines.rawItemId], references: [items.id] }),
}));

export const productionMaterialsRelations = relations(productionMaterials, ({ one }) => ({
  batch: one(productionBatches, {
    fields: [productionMaterials.batchId],
    references: [productionBatches.id],
  }),
  item: one(items, { fields: [productionMaterials.itemId], references: [items.id] }),
  warehouse: one(warehouses, { fields: [productionMaterials.warehouseId], references: [warehouses.id] }),
  outputLine: one(productionOutputs, {
    fields: [productionMaterials.outputLineId],
    references: [productionOutputs.id],
  }),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  item: one(items, { fields: [inventoryTransactions.itemId], references: [items.id] }),
  warehouse: one(warehouses, { fields: [inventoryTransactions.warehouseId], references: [warehouses.id] }),
}));

export const schema = {
  stores,
  applicationUsers,
  items,
  warehouses,
  stocks,
  inventoryTransactions,
  vendors,
  customers,
  purchaseInvoices,
  purchaseInvoiceItems,
  salesInvoices,
  salesInvoiceItems,
  productionBatches,
  productionOutputs,
  productionMaterials,
  recipes,
  recipeLines,
};

export type DbSchema = typeof schema;
