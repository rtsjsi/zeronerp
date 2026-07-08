"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

const warehouseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  location: z.string().optional(),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export interface WarehouseForDialog {
  id: string;
  name: string;
  code: string;
  location?: string | null;
}

interface EditWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: WarehouseForDialog | null;
  onSuccess: () => void;
}

export function EditWarehouseDialog({
  open,
  onOpenChange,
  warehouse,
  onSuccess,
}: EditWarehouseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      code: "",
      location: "",
    },
  });

  useEffect(() => {
    if (!open || !warehouse) return;

    form.reset({
      name: warehouse.name ?? "",
      code: warehouse.code ?? "",
      location: warehouse.location ?? "",
    });
  }, [open, warehouse, form]);

  async function onSubmit(data: WarehouseFormValues) {
    if (!warehouse) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        code: data.code,
        // Store location is nullable; treat empty as "clear"
        location: data.location && data.location.trim().length > 0 ? data.location : undefined,
      };

      const res = await apiFetch(`/api/inventory/warehouses/${warehouse.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success("Warehouse updated successfully");
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(res.message || "Failed to update warehouse");
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
          <DialogTitle>Edit Warehouse</DialogTitle>
          <DialogDescription>Update name, code, and location.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Warehouse Code</Label>
              <Input id="code" {...form.register("code")} placeholder="e.g. WH-01" />
              {form.formState.errors.code && (
                <p className="text-[10px] text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Warehouse Name</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g. Main Hub" />
              {form.formState.errors.name && (
                <p className="text-[10px] text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location / Address</Label>
            <Input id="location" {...form.register("location")} placeholder="e.g. Mumbai, Maharashtra" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !warehouse}>
              {isSubmitting ? "Updating..." : "Update Warehouse"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

