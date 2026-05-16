"use client";

import { useForm } from "react-hook-form";
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRightLeft, MoveDown, MoveUp } from "lucide-react";

const movementSchema = z.object({
  type: z.enum(["IN", "OUT", "MOVE"]),
  itemId: z.string().uuid("Please select an item"),
  warehouseId: z.string().uuid("Please select a warehouse").optional(),
  fromWarehouseId: z.string().uuid("Source warehouse is required").optional(),
  toWarehouseId: z.string().uuid("Destination warehouse is required").optional(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  reference: z.string().optional(),
}).refine((data) => {
  if (data.type === "MOVE") {
    return !!data.fromWarehouseId && !!data.toWarehouseId;
  }
  return !!data.warehouseId;
}, {
  message: "Warehouse selection is required",
  path: ["warehouseId"]
});

type MovementFormValues = z.infer<typeof movementSchema>;

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function StockMovementDialog({ open, onOpenChange, onSuccess }: StockMovementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [moveType, setMoveType] = useState<"IN" | "OUT" | "MOVE">("IN");

  useEffect(() => {
    if (open) {
      fetchItems();
      fetchWarehouses();
    }
  }, [open]);

  const fetchItems = async () => {
    const res = await apiFetch<any[]>("/api/inventory/items");
    if (res.success) setItems(res.data || []);
  };

  const fetchWarehouses = async () => {
    const res = await apiFetch<any[]>("/api/inventory/warehouses");
    if (res.success) setWarehouses(res.data || []);
  };

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: "IN",
      quantity: 1,
      reference: "",
    },
  });

  const handleTypeChange = (val: string) => {
    const type = val as "IN" | "OUT" | "MOVE";
    setMoveType(type);
    form.setValue("type", type);
  };

  async function onSubmit(data: MovementFormValues) {
    setIsSubmitting(true);
    try {
      let endpoint = "/api/inventory/stock/adjust";
      let payload: any = {
        itemId: data.itemId,
        quantity: data.type === "OUT" ? -data.quantity : data.quantity,
        type: data.type === "MOVE" ? "OUT" : data.type,
        warehouseId: data.warehouseId,
        reference: data.reference,
      };

      if (data.type === "MOVE") {
        endpoint = "/api/inventory/stock/transfer";
        payload = {
          itemId: data.itemId,
          fromWarehouseId: data.fromWarehouseId,
          toWarehouseId: data.toWarehouseId,
          quantity: data.quantity,
        };
      }

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success(data.type === "MOVE" ? "Stock transferred" : "Stock level adjusted");
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(res.message || "Failed to process movement");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Stock Movement</DialogTitle>
          <DialogDescription>
            Record stock arrival, removal, or transfer between warehouses.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="IN" className="w-full mt-4" onValueChange={handleTypeChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="IN" className="gap-2">
              <MoveDown className="w-3.5 h-3.5 text-emerald-500" /> Stock In
            </TabsTrigger>
            <TabsTrigger value="OUT" className="gap-2">
              <MoveUp className="w-3.5 h-3.5 text-red-500" /> Stock Out
            </TabsTrigger>
            <TabsTrigger value="MOVE" className="gap-2">
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" /> Transfer
            </TabsTrigger>
          </TabsList>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="itemId">Item</Label>
              <select
                id="itemId"
                {...form.register("itemId")}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select Item</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>)}
              </select>
              {form.formState.errors.itemId && (
                <p className="text-[10px] text-destructive">{form.formState.errors.itemId.message}</p>
              )}
            </div>

            {moveType !== "MOVE" ? (
              <div className="space-y-2">
                <Label htmlFor="warehouseId">Warehouse</Label>
                <select
                  id="warehouseId"
                  {...form.register("warehouseId")}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                {form.formState.errors.warehouseId && (
                  <p className="text-[10px] text-destructive">{form.formState.errors.warehouseId.message}</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromWarehouseId">From Warehouse</Label>
                  <select
                    id="fromWarehouseId"
                    {...form.register("fromWarehouseId")}
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Source</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.code}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toWarehouseId">To Warehouse</Label>
                  <select
                    id="toWarehouseId"
                    {...form.register("toWarehouseId")}
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Destination</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.code}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input type="number" step="0.001" {...form.register("quantity", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" {...form.register("reference")} placeholder="e.g. Invoice #, Internal" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Confirm Movement"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
