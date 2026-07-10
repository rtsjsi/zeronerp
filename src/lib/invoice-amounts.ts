/** Line amount = quantity × unit price (GST excluded). */
export function invoiceLineAmount(quantity: number, unitPrice: number): number {
  return Number((Number(quantity) * Number(unitPrice)).toFixed(2));
}

export function sumInvoiceLineAmounts(
  items: readonly { quantity: number; unitPrice: number }[],
): number {
  return Number(
    items.reduce((sum, item) => sum + invoiceLineAmount(item.quantity, item.unitPrice), 0).toFixed(2),
  );
}
