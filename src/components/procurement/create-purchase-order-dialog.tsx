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
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const poItemSchema = z.object({
  itemId: z.string().uuid("Please select an item"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitPrice: z.number().nonnegative("Price cannot be negative"),
});

const poSchema = z.object({
  vendorId: z.string().uuid("Please select a vendor"),
  poNumber: z.string().min(2, "PO Number is required"),
  notes: z.string().optional(),
  items: z.array(poItemSchema).min(1, "At least one item is required"),
});

type PoFormValues = z.infer<typeof poSchema>;

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreatePurchaseOrderDialog({ open, onOpenChange, onSuccess }: CreatePurchaseOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchVendors();
      fetchItems();
    }
  }, [open]);

  const fetchVendors = async () => {
    const res = await apiFetch<any[]>("/api/procurement/vendors");
    if (res.success) setVendors(res.data || []);
  };

  const fetchItems = async () => {
    const res = await apiFetch<any[]>("/api/inventory/items");
    if (res.success) setInventoryItems(res.data || []);
  };

  const form = useForm<PoFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      vendorId: "",
      poNumber: `PO-${Date.now().toString().slice(-6)}`,
      notes: "",
      items: [{ itemId: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const total = watchItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  async function onSubmit(data: PoFormValues) {
    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/procurement/orders", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (res.success) {
        toast.success("Purchase Order created successfully");
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(res.message || "Failed to create PO");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Generate a new purchase order for a vendor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto pr-2 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor</Label>
              <select
                id="vendorId"
                {...form.register("vendorId")}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              {form.formState.errors.vendorId && (
                <p className="text-[10px] text-destructive">{form.formState.errors.vendorId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="poNumber">PO Number</Label>
              <Input id="poNumber" {...form.register("poNumber")} placeholder="e.g. PO-001" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Order Items</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0 })}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-start p-3 rounded-lg bg-muted/30 border border-border animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex-1 space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase">Item</Label>
                    <select
                      {...form.register(`items.${index}.itemId`)}
                      className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onChange={(e) => {
                        const item = inventoryItems.find(i => i.id === e.target.value);
                        if (item) {
                          form.setValue(`items.${index}.unitPrice`, Number(item.basePrice));
                        }
                      }}
                    >
                      <option value="">Select Item</option>
                      {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>)}
                    </select>
                  </div>
                  <div className="w-24 space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase">Qty</Label>
                    <Input 
                      type="number" 
                      step="1"
                      className="h-9"
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} 
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase">Unit Price</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      className="h-9"
                      {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} 
                    />
                  </div>
                  <div className="pt-7">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => remove(index)}
                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {form.formState.errors.items && (
                <p className="text-xs text-destructive">{form.formState.errors.items.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} placeholder="Special instructions for the vendor..." />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-lg font-bold text-primary">
              Total: {formatCurrency(total)}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                {isSubmitting ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
