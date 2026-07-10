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
import { optionalGstnSchema, optionalPanSchema } from "@/lib/partner-schema";

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  pan: optionalPanSchema,
  gstn: optionalGstnSchema,
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCustomerDialog({ open, onOpenChange, onSuccess }: CreateCustomerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
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

  async function onSubmit(data: CustomerFormValues) {
    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/sales/customers", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (res.success) {
        toast.success("Customer added successfully");
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(res.message || "Failed to add customer");
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
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Register a new customer to manage sales orders.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input id="name" {...form.register("name")} placeholder="e.g. John Smith or Tech Solutions Inc" />
            {form.formState.errors.name && (
              <p className="text-[10px] text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Person</Label>
            <Input id="contactName" {...form.register("contactName")} placeholder="e.g. Jane Doe" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} placeholder="customer@example.com" />
              {form.formState.errors.email && (
                <p className="text-[10px] text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                {...form.register("pan")}
                placeholder="ABCDE1234F"
                maxLength={10}
                className="uppercase"
              />
              {form.formState.errors.pan && (
                <p className="text-[10px] text-destructive">{form.formState.errors.pan.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstn">GSTN</Label>
              <Input
                id="gstn"
                {...form.register("gstn")}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className="uppercase"
              />
              {form.formState.errors.gstn && (
                <p className="text-[10px] text-destructive">{form.formState.errors.gstn.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea 
              id="address" 
              {...form.register("address")} 
              placeholder="Full billing or shipping address..."
              className="resize-none h-20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
