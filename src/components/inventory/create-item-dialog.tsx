"use client";

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
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { ItemFormFields } from "@/components/inventory/item-form-fields";
import {
  defaultItemFormValues,
  itemFormSchema,
  serializeItemPayload,
  type ItemFormValues,
} from "@/lib/inventory/item-schema";

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateItemDialog({ open, onOpenChange, onSuccess }: CreateItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: defaultItemFormValues,
  });

  async function onSubmit(data: ItemFormValues) {
    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/inventory/items", {
        method: "POST",
        body: JSON.stringify(serializeItemPayload(data)),
      });

      if (res.success) {
        toast.success("Item created successfully");
        onSuccess();
        onOpenChange(false);
        form.reset(defaultItemFormValues);
      } else {
        toast.error(res.message || "Failed to create item");
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
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Create a new item in your inventory master.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <ItemFormFields form={form} />
          <div className="flex justify-end gap-3 pt-2">
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
