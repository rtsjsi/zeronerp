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

export interface CustomerForDialog {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  pan?: string | null;
  gstn?: string | null;
}

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerForDialog | null;
  onSuccess: () => void;
}

export function EditCustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: EditCustomerDialogProps) {
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
    if (!open || !customer) return;

    form.reset({
      name: customer.name ?? "",
      contactName: customer.contactName ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      address: customer.address ?? "",
      pan: customer.pan ?? "",
      gstn: customer.gstn ?? "",
    });
  }, [open, customer, form]);

  async function onSubmit(data: PartnerFormValues) {
    if (!customer) return;

    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/sales/customers/${customer.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (res.success) {
        toast.success("Customer updated successfully");
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(res.message || "Failed to update customer");
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
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>Update customer details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <PartnerFormFields
            form={form}
            nameLabel="Customer Name"
            namePlaceholder="e.g. John Smith or Tech Solutions Inc"
            addressPlaceholder="Full billing or shipping address..."
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !customer}>
              {isSubmitting ? "Updating..." : "Update Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
