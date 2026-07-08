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
    description: text('description'),
    category: text('category').notNull().default('RAW_MATERIAL'),
    itemType: text('itemType').notNull().default('STOCKABLE'),
    uom: text('uom').notNull().default('pcs'),
    hsnSacCode: text('hsnSacCode'),
    cgstPercent: real('cgstPercent').notNull().default(0),
    sgstPercent: real('sgstPercent').notNull().default(0),
    igstPercent: real('igstPercent').notNull().default(0),
    reorderLevel: real('reorderLevel').notNull().default(0),
    minStock: real('minStock').notNull().default(0),
    mrp: real('mrp').notNull().default(0),
    sellingPrice: real('sellingPrice').notNull().default(0),
    purchasePrice: real('purchasePrice').notNull().default(0),
    basePrice: real('basePrice').notNull().default(0),
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
    code: text('code').notNull(),
    location: text('location'),
    isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
    createdBy: text('createdBy'),
    ...timestamps,
  },
  (table) => [uniqueIndex('Warehouse_storeId_code').on(table.storeId, table.code)],
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
    financialYear: text('financialYear').notNull(),
    status: text('status').notNull().default('COMPLETED'),
    totalAmount: real('totalAmount').notNull().default(0),
    notes: text('notes'),
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
  totalPrice: real('totalPrice').notNull(),
});

export const salesInvoices = sqliteTable(
  'SalesInvoice',
  {
    id: text('id').primaryKey(),
    storeId: text('storeId').notNull().references(() => stores.id),
    customerId: text('customerId').notNull().references(() => customers.id),
    invoiceNumber: text('invoiceNumber').notNull(),
    financialYear: text('financialYear').notNull(),
    status: text('status').notNull().default('COMPLETED'),
    totalAmount: real('totalAmount').notNull().default(0),
    notes: text('notes'),
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
  totalPrice: real('totalPrice').notNull(),
});

export const productionBatches = sqliteTable('ProductionBatch', {
  id: text('id').primaryKey(),
  storeId: text('storeId').notNull().references(() => stores.id),
  batchNumber: text('batchNumber').notNull(),
  status: text('status').notNull().default('DRAFT'),
  notes: text('notes'),
  startTime: text('startTime'),
  endTime: text('endTime'),
  isDeleted: integer('isDeleted', { mode: 'boolean' }).notNull().default(false),
  createdBy: text('createdBy'),
  ...timestamps,
});

export const productionMaterials = sqliteTable('ProductionMaterial', {
  id: text('id').primaryKey(),
  storeId: text('storeId').notNull().references(() => stores.id),
  batchId: text('batchId').notNull().references(() => productionBatches.id, { onDelete: 'cascade' }),
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
  item: one(items, { fields: [purchaseInvoiceItems.itemId], references: [items.id] }),
  warehouse: one(warehouses, { fields: [purchaseInvoiceItems.warehouseId], references: [warehouses.id] }),
}));

export const salesInvoicesRelations = relations(salesInvoices, ({ one, many }) => ({
  customer: one(customers, { fields: [salesInvoices.customerId], references: [customers.id] }),
  items: many(salesInvoiceItems),
}));

export const salesInvoiceItemsRelations = relations(salesInvoiceItems, ({ one }) => ({
  item: one(items, { fields: [salesInvoiceItems.itemId], references: [items.id] }),
  warehouse: one(warehouses, { fields: [salesInvoiceItems.warehouseId], references: [warehouses.id] }),
}));

export const productionBatchesRelations = relations(productionBatches, ({ many }) => ({
  materials: many(productionMaterials),
}));

export const productionMaterialsRelations = relations(productionMaterials, ({ one }) => ({
  item: one(items, { fields: [productionMaterials.itemId], references: [items.id] }),
  warehouse: one(warehouses, { fields: [productionMaterials.warehouseId], references: [warehouses.id] }),
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
  productionMaterials,
};

export type DbSchema = typeof schema;
