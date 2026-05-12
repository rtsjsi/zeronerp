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
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

const itemSchema = z.object({
  sku: z.string().min(2, "SKU must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  uom: z.string().min(1, "UOM is required"),
  basePrice: z.number().min(0, "Price must be positive"),
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateItemDialog({ open, onOpenChange, onSuccess }: CreateItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      uom: "pcs",
      basePrice: 0,
    },
  });

  async function onSubmit(data: ItemFormValues) {
    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/inventory/items", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (res.success) {
        toast.success("Item created successfully");
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(res.message || "Failed to create item");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Create a new item in your inventory. You can add stock levels after creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Code</Label>
              <Input id="sku" {...form.register("sku")} placeholder="e.g. ITEM-001" />
              {form.formState.errors.sku && (
                <p className="text-[10px] text-destructive">{form.formState.errors.sku.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="uom">Unit of Measure</Label>
              <Input id="uom" {...form.register("uom")} placeholder="e.g. pcs, kg, m" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" {...form.register("name")} placeholder="e.g. Office Chair" />
            {form.formState.errors.name && (
              <p className="text-[10px] text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              {...form.register("description")} 
              placeholder="Brief details about the item..."
              className="resize-none h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price (₹)</Label>
            <Input id="basePrice" type="number" step="0.01" {...form.register("basePrice", { valueAsNumber: true })} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
