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
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

const warehouseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  location: z.string().optional(),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

interface CreateWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateWarehouseDialog({ open, onOpenChange, onSuccess }: CreateWarehouseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      code: "",
      location: "",
    },
  });

  async function onSubmit(data: WarehouseFormValues) {
    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/inventory/warehouses", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (res.success) {
        toast.success("Warehouse created successfully");
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(res.message || "Failed to create warehouse");
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
          <DialogTitle>Add New Warehouse</DialogTitle>
          <DialogDescription>
            Create a storage location for your inventory items.
          </DialogDescription>
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
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Warehouse"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
