"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Plus, Trash2, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const invoiceItemSchema = z.object({
  itemId: z.string().uuid("Please select an item"),
  warehouseId: z.string().uuid("Please select a warehouse"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitPrice: z.number().nonnegative("Price cannot be negative"),
});

const invoiceSchema = z.object({
  customerId: z.string().uuid("Please select a customer"),
  invoiceNumber: z.string().min(2, "Invoice number is required"),
  financialYear: z.string().min(4, "Financial year is required"),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateInvoiceDialog({ open, onOpenChange, onSuccess }: CreateInvoiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchItems();
      fetchWarehouses();
    }
  }, [open]);

  const fetchCustomers = async () => {
    const res = await apiFetch<any[]>("/api/sales/customers");
    if (res.success) setCustomers(res.data || []);
  };

  const fetchItems = async () => {
    const res = await apiFetch<any[]>("/api/inventory/items");
    if (res.success) setInventoryItems(res.data || []);
  };

  const fetchWarehouses = async () => {
    const res = await apiFetch<any[]>("/api/inventory/warehouses");
    if (res.success) setWarehouses(res.data || []);
  };

  // Determine current financial year based on current date
  const getCurrentFinancialYear = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    // FY is April to March
    if (currentMonth >= 3) {
      return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    } else {
      return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
    }
  };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: "",
      invoiceNumber: "",
      financialYear: getCurrentFinancialYear(),
      notes: "",
      items: [{ itemId: "", warehouseId: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const total = watchItems ? watchItems.reduce((acc, item) => acc + (Number(item?.quantity || 0) * Number(item?.unitPrice || 0)), 0) : 0;

  useEffect(() => {
    if (open) {
      form.setValue("invoiceNumber", `SINV-${Date.now().toString().slice(-6)}`);
    }
  }, [open, form]);

  async function onSubmit(data: InvoiceFormValues) {
    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/sales/invoices", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (res.success) {
        toast.success("Sales Invoice created & stock deducted successfully");
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(res.message || "Failed to create invoice");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" /> Create Sales Invoice
          </DialogTitle>
          <DialogDescription>
            Enter details to bill a Customer. This will immediately deduct the Stock from selected Warehouse(s).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto pr-2 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="customerId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer</Label>
              <select
                id="customerId"
                {...form.register("customerId")}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/25 outline-none"
              >
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {form.formState.errors.customerId && (
                <p className="text-[10px] text-destructive font-medium">{form.formState.errors.customerId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNumber" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice No.</Label>
              <Input 
                id="invoiceNumber" 
                placeholder="e.g. SINV-001"
                {...form.register("invoiceNumber")} 
                className="h-10"
              />
              {form.formState.errors.invoiceNumber && (
                <p className="text-[10px] text-destructive font-medium">{form.formState.errors.invoiceNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="financialYear" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Financial Year</Label>
              <select
                id="financialYear"
                {...form.register("financialYear")}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/25 outline-none"
              >
                <option value="2025-26">2025-26</option>
                <option value="2026-27">2026-27</option>
                <option value="2027-28">2027-28</option>
              </select>
              {form.formState.errors.financialYear && (
                <p className="text-[10px] text-destructive font-medium">{form.formState.errors.financialYear.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Products & Materials</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ itemId: "", warehouseId: warehouses[0]?.id || "", quantity: 1, unitPrice: 0 })}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col md:flex-row gap-3 items-end p-4 rounded-xl bg-card border border-border shadow-sm">
                  <div className="flex-1 w-full space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product Item</Label>
                    <select
                      {...form.register(`items.${index}.itemId`)}
                      className="w-full flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/25 outline-none"
                      onChange={(e) => {
                        const item = inventoryItems.find(i => i.id === e.target.value);
                        if (item) {
                          form.setValue(`items.${index}.unitPrice`, Number(item.basePrice));
                        }
                      }}
                    >
                      <option value="">Select Product...</option>
                      {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>

                  <div className="w-full md:w-44 space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Warehouse (Deduct)</Label>
                    <select
                      {...form.register(`items.${index}.warehouseId`)}
                      className="w-full flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/25 outline-none"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>

                  <div className="w-full md:w-24 space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quantity (packs)</Label>
                    <Input 
                      type="number" 
                      step="0.001"
                      className="h-10 rounded-lg"
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} 
                    />
                  </div>

                  <div className="w-full md:w-28 space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Unit Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input 
                        type="number" 
                        step="0.01"
                        className="h-10 pl-7 rounded-lg"
                        {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} 
                      />
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => remove(index)}
                    className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {form.formState.errors.items && (
                <p className="text-xs text-destructive font-medium">{form.formState.errors.items.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Remarks</Label>
            <Textarea id="notes" {...form.register("notes")} placeholder="Enter invoice notes or customer instructions..." />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-lg font-bold text-primary">
              Total Invoice Amount: {formatCurrency(total)}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <Receipt className="w-4 h-4" />
                {isSubmitting ? "Creating Invoice..." : "Create Invoice & Deduct Stock"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
