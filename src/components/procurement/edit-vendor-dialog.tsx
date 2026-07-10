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
import { partnerFormSchema, type PartnerFormValues } from "@/lib/partner-schema";
import { PartnerFormFields } from "@/components/shared/partner-form-fields";

export interface VendorForDialog {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  pan?: string | null;
  gstn?: string | null;
}

interface EditVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: VendorForDialog | null;
  onSuccess: () => void;
}

export function EditVendorDialog({
  open,
  onOpenChange,
  vendor,
  onSuccess,
}: EditVendorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      pan: "",
      gstn: "",
    },
  });

  useEffect(() => {
    if (!open || !vendor) return;

    form.reset({
      name: vendor.name ?? "",
      contactName: vendor.contactName ?? "",
      email: vendor.email ?? "",
      phone: vendor.phone ?? "",
      address: vendor.address ?? "",
      pan: vendor.pan ?? "",
      gstn: vendor.gstn ?? "",
    });
  }, [open, vendor, form]);

  async function onSubmit(data: PartnerFormValues) {
    if (!vendor) return;

    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/procurement/vendors/${vendor.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (res.success) {
        toast.success("Vendor updated successfully");
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(res.message || "Failed to update vendor");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
          <DialogDescription>Update supplier details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <PartnerFormFields
            form={form}
            nameLabel="Vendor Name"
            namePlaceholder="e.g. Acme Corp"
            addressPlaceholder="Full office or warehouse address..."
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !vendor}>
              {isSubmitting ? "Updating..." : "Update Vendor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
