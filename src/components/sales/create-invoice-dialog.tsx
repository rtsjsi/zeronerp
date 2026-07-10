"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Plus, Trash2, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { ItemSelect } from "@/components/shared/item-select";
import { LovSelect, type LovOption } from "@/components/shared/lov-select";

const invoiceItemSchema = z.object({
  itemId: z.string().min(1, "Please select a product"),
  warehouseId: z.string().min(1, "Please select a warehouse"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitPrice: z.number().nonnegative("Price cannot be negative"),
  gstRate: z.number().min(0, "GST cannot be negative").max(100, "GST cannot exceed 100%"),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  invoiceNumber: z.string().min(2, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  financialYear: z.string().min(4, "Financial year is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one line item is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InventoryItem {
  id: string;
  name: string;
  mrp: number;
  gstRate?: number;
}

export interface SalesInvoiceForEdit {
  id: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: string;
  financialYear: string;
  items: {
    itemId: string;
    warehouseId: string;
    quantity: number;
    unitPrice: number;
    gstRate?: number;
  }[];
}

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  invoice?: SalesInvoiceForEdit | null;
}

function getCurrentFinancialYear() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  if (currentMonth >= 3) {
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
  }
  return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
}

function getFinancialYearOptions(): LovOption[] {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  return [-1, 0, 1, 2].map((offset) => {
    const fyStart = startYear + offset;
    const label = `${fyStart}-${(fyStart + 1).toString().slice(-2)}`;
    return { value: label, label };
  });
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function makeInvoiceNumber() {
  return `SINV-${Date.now().toString().slice(-6)}`;
}

function lineAmounts(qty: number, unitPrice: number, gstRate: number) {
  const taxable = qty * unitPrice;
  const gst = taxable * (gstRate / 100);
  return { taxable, gst, total: taxable + gst };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[10px] text-destructive font-medium">{message}</p>;
}

function GstRateField({
  value,
  onChange,
  error,
}: {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          type="number"
          step="0.01"
          min={0}
          max={100}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-9 text-xs pr-6 px-2"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">
          %
        </span>
      </div>
      <FieldError message={error} />
    </div>
  );
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  onSuccess,
  invoice,
}: CreateInvoiceDialogProps) {
  const isEditing = Boolean(invoice);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

  const financialYearOptions = useMemo(() => getFinancialYearOptions(), []);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: "",
      invoiceNumber: "",
      invoiceDate: todayIsoDate(),
      financialYear: getCurrentFinancialYear(),
      items: [{ itemId: "", warehouseId: "", quantity: 1, unitPrice: 0, gstRate: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");

  const totals = useMemo(() => {
    if (!watchItems?.length) return { subtotal: 0, gst: 0, total: 0 };
    return watchItems.reduce(
      (acc, item) => {
        const { taxable, gst, total } = lineAmounts(
          Number(item?.quantity || 0),
          Number(item?.unitPrice || 0),
          Number(item?.gstRate || 0),
        );
        return {
          subtotal: acc.subtotal + taxable,
          gst: acc.gst + gst,
          total: acc.total + total,
        };
      },
      { subtotal: 0, gst: 0, total: 0 },
    );
  }, [watchItems]);

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c.id, label: c.name })),
    [customers],
  );

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ value: w.id, label: w.name })),
    [warehouses],
  );

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const [customerRes, itemRes, whRes] = await Promise.all([
        apiFetch<{ id: string; name: string }[]>("/api/sales/customers"),
        apiFetch<InventoryItem[]>("/api/inventory/items"),
        apiFetch<{ id: string; name: string }[]>("/api/inventory/warehouses"),
      ]);

      const loadedCustomers = customerRes.success ? customerRes.data || [] : [];
      const loadedItems = itemRes.success ? itemRes.data || [] : [];
      const loadedWarehouses = whRes.success ? whRes.data || [] : [];

      setCustomers(loadedCustomers);
      setInventoryItems(loadedItems);
      setWarehouses(loadedWarehouses);

      if (invoice) {
        form.reset({
          customerId: invoice.customerId,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          financialYear: invoice.financialYear,
          items: invoice.items.map((item) => ({
            itemId: item.itemId,
            warehouseId: item.warehouseId,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            gstRate: Number(item.gstRate ?? 0),
          })),
        });
      } else {
        form.reset({
          customerId: "",
          invoiceNumber: makeInvoiceNumber(),
          invoiceDate: todayIsoDate(),
          financialYear: getCurrentFinancialYear(),
          items: [
            {
              itemId: "",
              warehouseId: loadedWarehouses[0]?.id || "",
              quantity: 1,
              unitPrice: 0,
              gstRate: 0,
            },
          ],
        });
      }
    };

    void load();
  }, [open, form, invoice]);

  async function onSubmit(data: InvoiceFormValues) {
    setIsSubmitting(true);
    try {
      const res = await apiFetch(
        isEditing ? `/api/sales/invoices/${invoice!.id}` : "/api/sales/invoices",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(data),
        },
      );

      if (res.success) {
        toast.success(
          isEditing
            ? "Sales Invoice updated & stock adjusted successfully"
            : "Sales Invoice created & stock deducted successfully",
        );
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.message || `Failed to ${isEditing ? "update" : "create"} invoice`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[920px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Receipt className="w-5 h-5 text-primary" />
            {isEditing ? "Edit Sales Invoice" : "Create Sales Invoice"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update customer invoice details. Stock levels will be adjusted to match the revised line items."
              : "Bill a customer and deduct stock from the selected warehouse(s)."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Customer
                  </Label>
                  <Controller
                    name="customerId"
                    control={form.control}
                    render={({ field }) => (
                      <LovSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        options={customerOptions}
                        placeholder="Select customer..."
                        className="h-10"
                      />
                    )}
                  />
                  <FieldError message={form.formState.errors.customerId?.message} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Financial Year
                  </Label>
                  <Controller
                    name="financialYear"
                    control={form.control}
                    render={({ field }) => (
                      <LovSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        options={financialYearOptions}
                        placeholder="Select FY..."
                        className="h-10"
                      />
                    )}
                  />
                  <FieldError message={form.formState.errors.financialYear?.message} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Invoice No.
                  </Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="e.g. SINV-001"
                    {...form.register("invoiceNumber")}
                    className="h-10"
                  />
                  <FieldError message={form.formState.errors.invoiceNumber?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Invoice Date
                  </Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    {...form.register("invoiceDate")}
                    className="h-10"
                  />
                  <FieldError message={form.formState.errors.invoiceDate?.message} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-base font-semibold">Line Items</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add products shipped against this sales invoice.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      itemId: "",
                      warehouseId: warehouses[0]?.id || "",
                      quantity: 1,
                      unitPrice: 0,
                      gstRate: 0,
                    })
                  }
                  className="gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Line
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[860px]">
                    <div className="grid grid-cols-[minmax(220px,2fr)_120px_72px_96px_72px_96px_40px] gap-2 px-3 py-2 bg-muted/40 border-b text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Product</span>
                      <span>Warehouse</span>
                      <span>Qty</span>
                      <span>Unit Price</span>
                      <span>GST %</span>
                      <span className="text-right">Line Total</span>
                      <span />
                    </div>

                    <div className="divide-y">
                      {fields.map((field, index) => {
                        const line = watchItems?.[index];
                        const { total: lineTotal } = lineAmounts(
                          Number(line?.quantity || 0),
                          Number(line?.unitPrice || 0),
                          Number(line?.gstRate || 0),
                        );

                        return (
                          <div
                            key={field.id}
                            className="grid grid-cols-[minmax(220px,2fr)_120px_72px_96px_72px_96px_40px] gap-2 px-3 py-3 items-start"
                          >
                            <div className="min-w-0">
                              <Controller
                                name={`items.${index}.itemId`}
                                control={form.control}
                                render={({ field: itemField }) => (
                                  <ItemSelect
                                    value={itemField.value}
                                    onValueChange={(itemId) => {
                                      itemField.onChange(itemId);
                                      const item = inventoryItems.find((i) => i.id === itemId);
                                      if (item) {
                                        form.setValue(`items.${index}.unitPrice`, Number(item.mrp));
                                        form.setValue(`items.${index}.gstRate`, Number(item.gstRate ?? 0));
                                      }
                                    }}
                                    items={inventoryItems}
                                    placeholder="Select product..."
                                    searchPlaceholder="Search products..."
                                    showUom={false}
                                  />
                                )}
                              />
                              <FieldError message={form.formState.errors.items?.[index]?.itemId?.message} />
                            </div>

                            <div className="min-w-0">
                              <Controller
                                name={`items.${index}.warehouseId`}
                                control={form.control}
                                render={({ field: whField }) => (
                                  <LovSelect
                                    value={whField.value}
                                    onValueChange={whField.onChange}
                                    options={warehouseOptions}
                                    placeholder="Warehouse"
                                    className="h-9 text-xs"
                                  />
                                )}
                              />
                              <FieldError message={form.formState.errors.items?.[index]?.warehouseId?.message} />
                            </div>

                            <div>
                              <Input
                                type="number"
                                step="0.001"
                                className="h-9 text-xs px-2"
                                {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                              />
                              <FieldError message={form.formState.errors.items?.[index]?.quantity?.message} />
                            </div>

                            <div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                                  ₹
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-9 pl-6 text-xs px-2"
                                  {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                />
                              </div>
                              <FieldError message={form.formState.errors.items?.[index]?.unitPrice?.message} />
                            </div>

                            <div>
                              <Controller
                                name={`items.${index}.gstRate`}
                                control={form.control}
                                render={({ field: gstField }) => (
                                  <GstRateField
                                    value={gstField.value}
                                    onChange={gstField.onChange}
                                    error={form.formState.errors.items?.[index]?.gstRate?.message}
                                  />
                                )}
                              />
                            </div>

                            <div className="h-9 flex items-center justify-end text-sm font-semibold text-primary tabular-nums">
                              {formatCurrency(lineTotal)}
                            </div>

                            <div className="flex justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {form.formState.errors.items?.message && (
                <FieldError message={form.formState.errors.items.message} />
              )}
            </div>
          </div>

          <div className="border-t bg-muted/20 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-6 text-muted-foreground">
                <span>Taxable: {formatCurrency(totals.subtotal)}</span>
                <span>GST: {formatCurrency(totals.gst)}</span>
              </div>
              <div className="text-lg font-bold text-primary">
                Grand Total: {formatCurrency(totals.total)}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <Receipt className="w-4 h-4" />
                {isSubmitting
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save Changes"
                    : "Create & Deduct Stock"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
