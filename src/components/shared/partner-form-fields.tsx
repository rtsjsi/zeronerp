"use client";

import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PartnerFormValues } from "@/lib/partner-schema";

interface PartnerFormFieldsProps {
  form: UseFormReturn<PartnerFormValues>;
  nameLabel: string;
  namePlaceholder: string;
  addressPlaceholder: string;
}

export function PartnerFormFields({
  form,
  nameLabel,
  namePlaceholder,
  addressPlaceholder,
}: PartnerFormFieldsProps) {
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">{nameLabel}</Label>
        <Input id="name" {...register("name")} placeholder={namePlaceholder} />
        {errors.name && (
          <p className="text-[10px] text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactName">Contact Person</Label>
        <Input id="contactName" {...register("contactName")} placeholder="e.g. John Doe" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="name@example.com" />
          {errors.email && (
            <p className="text-[10px] text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder="+91 98765 43210" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pan">PAN</Label>
          <Input
            id="pan"
            {...register("pan")}
            placeholder="ABCDE1234F"
            maxLength={10}
            className="uppercase"
          />
          {errors.pan && (
            <p className="text-[10px] text-destructive">{errors.pan.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gstn">GSTN</Label>
          <Input
            id="gstn"
            {...register("gstn")}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
            className="uppercase"
          />
          {errors.gstn && (
            <p className="text-[10px] text-destructive">{errors.gstn.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          {...register("address")}
          placeholder={addressPlaceholder}
          className="resize-none h-20"
        />
      </div>
    </>
  );
}
