"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UOM_OPTIONS } from "@/lib/inventory/constants";
import {
  ITEM_CATEGORY_OPTIONS,
  ITEM_TYPE_OPTIONS,
  type ItemFormValues,
} from "@/lib/inventory/item-schema";

interface ItemFormFieldsProps {
  form: UseFormReturn<ItemFormValues>;
  skuReadOnly?: boolean;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[10px] text-destructive">{message}</p>;
}

export function ItemFormFields({ form, skuReadOnly = false }: ItemFormFieldsProps) {
  const { register, control, formState, watch } = form;
  const itemType = watch("itemType");
  const errors = formState.errors;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Basic Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU / Item Code</Label>
            <Input
              id="sku"
              {...register("sku")}
              placeholder="e.g. RM-STEEL-01"
              readOnly={skuReadOnly}
              className={skuReadOnly ? "bg-muted" : undefined}
            />
            <FieldError message={errors.sku?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" {...register("name")} placeholder="e.g. Mild Steel Rod" />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.category?.message} />
          </div>

          <div className="space-y-2">
            <Label>Item Type</Label>
            <Controller
              name="itemType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.itemType?.message} />
          </div>

          <div className="space-y-2">
            <Label>Unit of Measure</Label>
            <Controller
              name="uom"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select UOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {UOM_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.uom?.message} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? "active" : "inactive"}
                  onValueChange={(val) => field.onChange(val === "active")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Brief details about the item..."
            className="resize-none h-20"
          />
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Pricing
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mrp">MRP (₹)</Label>
            <Input id="mrp" type="number" step="0.01" {...register("mrp", { valueAsNumber: true })} />
            <FieldError message={errors.mrp?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">Selling Price (₹)</Label>
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              {...register("sellingPrice", { valueAsNumber: true })}
            />
            <FieldError message={errors.sellingPrice?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              {...register("purchasePrice", { valueAsNumber: true })}
            />
            <FieldError message={errors.purchasePrice?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price (₹)</Label>
            <Input
              id="basePrice"
              type="number"
              step="0.01"
              {...register("basePrice", { valueAsNumber: true })}
            />
            <FieldError message={errors.basePrice?.message} />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          GST (India)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="hsnSacCode">HSN / SAC Code</Label>
            <Input id="hsnSacCode" {...register("hsnSacCode")} placeholder="e.g. 1517" maxLength={8} />
            <FieldError message={errors.hsnSacCode?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cgstPercent">CGST (%)</Label>
            <Input
              id="cgstPercent"
              type="number"
              step="0.01"
              {...register("cgstPercent", { valueAsNumber: true })}
            />
            <FieldError message={errors.cgstPercent?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sgstPercent">SGST (%)</Label>
            <Input
              id="sgstPercent"
              type="number"
              step="0.01"
              {...register("sgstPercent", { valueAsNumber: true })}
            />
            <FieldError message={errors.sgstPercent?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="igstPercent">IGST (%)</Label>
            <Input
              id="igstPercent"
              type="number"
              step="0.01"
              {...register("igstPercent", { valueAsNumber: true })}
            />
            <FieldError message={errors.igstPercent?.message} />
          </div>
        </div>
      </div>

      {itemType === "STOCKABLE" && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Stock Alerts
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  step="0.01"
                  {...register("reorderLevel", { valueAsNumber: true })}
                />
                <FieldError message={errors.reorderLevel?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  step="0.01"
                  {...register("minStock", { valueAsNumber: true })}
                />
                <FieldError message={errors.minStock?.message} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
