"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import type { RecipeRow } from "@/components/production/recipe-table";

const recipeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  finishedItemId: z.string().min(1, "Select a finished good"),
  outputQuantity: z.number().positive("Output quantity must be greater than zero"),
  notes: z.string().optional(),
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

interface EditRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: RecipeRow | null;
  onSuccess: () => void;
}

export function EditRecipeDialog({ open, onOpenChange, recipe, onSuccess }: EditRecipeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [fullRecipe, setFullRecipe] = useState<any | null>(null);

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: "",
      finishedItemId: "",
      outputQuantity: 1,
      notes: "",
      lines: [{ rawItemId: "", quantity: 0 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "lines" });

  useEffect(() => {
    if (!open || !recipe) return;

    const load = async () => {
      const [itemsRes, recipeRes] = await Promise.all([
        apiFetch<any[]>("/api/inventory/items"),
        apiFetch<any>(`/api/production/recipes/${recipe.id}`),
      ]);

      if (itemsRes.success && itemsRes.data) {
        setFinishedGoods(itemsRes.data.filter((i) => i.category === "FINISHED_GOODS"));
        setRawMaterials(itemsRes.data.filter((i) => i.category === "RAW_MATERIAL"));
      }

      if (recipeRes.success && recipeRes.data) {
        const data = recipeRes.data;
        setFullRecipe(data);
        form.reset({
          name: data.name,
          finishedItemId: data.finishedItemId,
          outputQuantity: Number(data.outputQuantity),
          notes: data.notes ?? "",
          lines: data.lines.map((line: any) => ({
            rawItemId: line.rawItemId,
            quantity: Number(line.quantity),
          })),
        });
        replace(
          data.lines.map((line: any) => ({
            rawItemId: line.rawItemId,
            quantity: Number(line.quantity),
          })),
        );
      }
    };

    load();
  }, [open, recipe, form, replace]);

  async function onSubmit(data: RecipeFormValues) {
    if (!recipe) return;

    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/production/recipes/${recipe.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (res.success) {
        toast.success("Recipe updated");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.message || "Failed to update recipe");
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
          <DialogTitle>Edit Recipe</DialogTitle>
          <DialogDescription>Update recipe for {fullRecipe?.name ?? "this recipe"}.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-name">Recipe Name</Label>
              <Input id="edit-name" {...form.register("name")} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-finishedItemId">Finished Good</Label>
              <select
                id="edit-finishedItemId"
                {...form.register("finishedItemId")}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select finished good</option>
                {finishedGoods.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.uom})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-outputQuantity">Output Quantity (basis)</Label>
              <Input
                id="edit-outputQuantity"
                type="number"
                step="0.001"
                {...form.register("outputQuantity", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" {...form.register("notes")} className="resize-none h-16" />
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
                  <select
                    {...form.register(`lines.${index}.rawItemId`)}
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select raw material</option>
                    {rawMaterials.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.uom})
                      </option>
                    ))}
                  </select>
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
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !recipe}>
              {isSubmitting ? "Saving..." : "Update Recipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
