"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { ItemSelect } from "@/components/shared/item-select";

const recipeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  finishedItemId: z.string().min(1, "Select a finished good"),
  outputQuantity: z.number().positive("Output quantity must be greater than zero"),
  lines: z
    .array(
      z.object({
        rawItemId: z.string().min(1, "Select raw material"),
        quantity: z.number().positive("Quantity must be greater than zero"),
      }),
    )
    .min(1, "Add at least one raw material"),
});

type RecipeFormValues = z.infer<typeof recipeSchema>;

interface CreateRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateRecipeDialog({ open, onOpenChange, onSuccess }: CreateRecipeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: "",
      finishedItemId: "",
      outputQuantity: 1,
      lines: [{ rawItemId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });

  useEffect(() => {
    if (!open) return;

    const loadItems = async () => {
      const res = await apiFetch<any[]>("/api/inventory/items");
      if (res.success && res.data) {
        setFinishedGoods(res.data.filter((i) => i.category === "FINISHED_GOODS"));
        setRawMaterials(res.data);
      }
    };

    loadItems();
    form.reset({
      name: "",
      finishedItemId: "",
      outputQuantity: 1,
      lines: [{ rawItemId: "", quantity: 1 }],
    });
  }, [open, form]);

  async function onSubmit(data: RecipeFormValues) {
    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/production/recipes", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (res.success) {
        toast.success("Recipe created");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.message || "Failed to create recipe");
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
          <DialogTitle>Create Recipe</DialogTitle>
          <DialogDescription>
            Define raw materials required to produce a finished good (e.g. per 1 Ltr of oil).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Recipe Name</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g. Groundnut Oil 1Ltr" />
              {form.formState.errors.name && (
                <p className="text-[10px] text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="finishedItemId">Finished Good</Label>
              <Controller
                name="finishedItemId"
                control={form.control}
                render={({ field }) => (
                  <ItemSelect
                    id="finishedItemId"
                    value={field.value}
                    onValueChange={field.onChange}
                    items={finishedGoods}
                    placeholder="Select finished good"
                    searchPlaceholder="Search finished goods..."
                  />
                )}
              />
              {form.formState.errors.finishedItemId && (
                <p className="text-[10px] text-destructive">
                  {form.formState.errors.finishedItemId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputQuantity">Output Quantity (basis)</Label>
              <Input
                id="outputQuantity"
                type="number"
                step="0.001"
                {...form.register("outputQuantity", { valueAsNumber: true })}
              />
              {form.formState.errors.outputQuantity && (
                <p className="text-[10px] text-destructive">
                  {form.formState.errors.outputQuantity.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Raw Materials Required</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => append({ rawItemId: "", quantity: 1 })}
              >
                <Plus className="w-3.5 h-3.5" /> Add Line
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-7 space-y-1">
                  <Controller
                    name={`lines.${index}.rawItemId`}
                    control={form.control}
                    render={({ field }) => (
                      <ItemSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        items={rawMaterials}
                        placeholder="Select raw material"
                        searchPlaceholder="Search items..."
                      />
                    )}
                  />
                </div>
                <div className="sm:col-span-4 space-y-1">
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="Qty"
                    {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {form.formState.errors.lines && (
              <p className="text-[10px] text-destructive">
                {form.formState.errors.lines.message || form.formState.errors.lines.root?.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Recipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
