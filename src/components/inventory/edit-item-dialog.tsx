"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { ItemFormFields } from "@/components/inventory/item-form-fields";
import {
  defaultItemFormValues,
  itemFormSchema,
  itemToFormValues,
  serializeItemPayload,
  type ItemFormValues,
} from "@/lib/inventory/item-schema";

export interface ItemForDialog {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  itemType: string;
  uom: string;
  hsnSacCode?: string | null;
  gstRate: number;
  reorderLevel: number;
  minStock: number;
  cost: number;
  mrp: number;
  isActive: boolean;
}

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemForDialog | null;
  onSuccess: () => void;
}

export function EditItemDialog({ open, onOpenChange, item, onSuccess }: EditItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: defaultItemFormValues,
  });

  useEffect(() => {
    if (!open || !item) return;
    form.reset(itemToFormValues(item));
  }, [open, item, form]);

  async function onSubmit(data: ItemFormValues) {
    if (!item) return;

    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/inventory/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify(serializeItemPayload(data)),
      });

      if (res.success) {
        toast.success("Item updated successfully");
        onSuccess();
        onOpenChange(false);
        form.reset(defaultItemFormValues);
      } else {
        toast.error(res.message || "Failed to update item");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>Update item master details for {item?.name ?? "this item"}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <ItemFormFields form={form} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !item}>
              {isSubmitting ? "Updating..." : "Update Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
