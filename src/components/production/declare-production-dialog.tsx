"use client";

import { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

const declareSchema = z.object({
  recipeId: z.string().min(1, "Select a recipe"),
  batchNumber: z.string().trim().min(1, "Batch number is required"),
  notes: z.string().optional(),
  outputQuantity: z.number().positive("Output quantity must be greater than zero"),
  outputWarehouseId: z.string().min(1, "Select output warehouse"),
  inputWarehouseId: z.string().min(1, "Select raw material warehouse"),
  inputs: z
    .array(
      z.object({
        itemId: z.string().min(1),
        warehouseId: z.string().min(1),
        quantity: z.number().positive("Quantity must be greater than zero"),
      }),
    )
    .min(1),
  outputItemId: z.string().min(1),
  outputQty: z.number().positive("Output quantity must be greater than zero"),
});

type DeclareFormValues = z.infer<typeof declareSchema>;

interface DeclareProductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function makeBatchNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 5).replace(":", "");
  return `PRD-${date}-${time}`;
}

export function DeclareProductionDialog({
  open,
  onOpenChange,
  onSuccess,
}: DeclareProductionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);

  const form = useForm<DeclareFormValues>({
    resolver: zodResolver(declareSchema),
    defaultValues: {
      recipeId: "",
      batchNumber: makeBatchNumber(),
      notes: "",
      outputQuantity: 1,
      outputWarehouseId: "",
      inputWarehouseId: "",
      inputs: [],
      outputItemId: "",
      outputQty: 1,
    },
  });

  const { fields, replace } = useFieldArray({ control: form.control, name: "inputs" });

  const recipeId = form.watch("recipeId");
  const outputQuantity = form.watch("outputQuantity");
  const inputWarehouseId = form.watch("inputWarehouseId");
  const outputWarehouseId = form.watch("outputWarehouseId");

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const [recipesRes, warehousesRes] = await Promise.all([
        apiFetch<any[]>("/api/production/recipes"),
        apiFetch<any[]>("/api/inventory/warehouses"),
      ]);

      if (recipesRes.success && recipesRes.data) {
        setRecipes(recipesRes.data.filter((r) => r.isActive));
      }
      if (warehousesRes.success && warehousesRes.data) {
        setWarehouses(warehousesRes.data);
        const defaultWh = warehousesRes.data[0]?.id ?? "";
        form.setValue("outputWarehouseId", defaultWh);
        form.setValue("inputWarehouseId", defaultWh);
      }

      form.reset({
        recipeId: "",
        batchNumber: makeBatchNumber(),
        notes: "",
        outputQuantity: 1,
        outputWarehouseId: warehousesRes.data?.[0]?.id ?? "",
        inputWarehouseId: warehousesRes.data?.[0]?.id ?? "",
        inputs: [],
        outputItemId: "",
        outputQty: 1,
      });
      setSelectedRecipe(null);
      replace([]);
    };

    load();
  }, [open, form, replace]);

  useEffect(() => {
    if (!recipeId) {
      setSelectedRecipe(null);
      return;
    }

    const recipe = recipes.find((r) => r.id === recipeId);
    setSelectedRecipe(recipe ?? null);

    if (!recipe) return;

    const basis = Number(recipe.outputQuantity) || 1;
    const factor = (Number(outputQuantity) || 1) / basis;

    form.setValue("outputItemId", recipe.finishedItemId);
    form.setValue("outputQty", Number(outputQuantity) || 1);

    const scaledInputs = (recipe.lines ?? []).map((line: any) => ({
      itemId: line.rawItemId,
      warehouseId: inputWarehouseId || warehouses[0]?.id || "",
      quantity: Number((Number(line.quantity) * factor).toFixed(3)),
    }));

    replace(scaledInputs);
  }, [recipeId, outputQuantity, recipes, form, replace, inputWarehouseId, warehouses]);

  useEffect(() => {
    if (!inputWarehouseId) return;
    const current = form.getValues("inputs");
    if (!current.length) return;
    replace(current.map((line) => ({ ...line, warehouseId: inputWarehouseId })));
  }, [inputWarehouseId, form, replace]);

  const finishedItemName = useMemo(
    () => selectedRecipe?.finishedItem?.name ?? "Finished good",
    [selectedRecipe],
  );

  async function onSubmit(data: DeclareFormValues) {
    setIsSubmitting(true);
    try {
      const materials = [
        ...data.inputs.map((line) => ({
          itemId: line.itemId,
          warehouseId: line.warehouseId,
          type: "INPUT" as const,
          quantity: line.quantity,
        })),
        {
          itemId: data.outputItemId,
          warehouseId: data.outputWarehouseId,
          type: "OUTPUT" as const,
          quantity: data.outputQty,
        },
      ];

      const res = await apiFetch("/api/production/declare", {
        method: "POST",
        body: JSON.stringify({
          recipeId: data.recipeId,
          batchNumber: data.batchNumber,
          notes: data.notes,
          materials,
        }),
      });

      if (res.success) {
        toast.success("Production declared — stock updated");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.message || "Failed to declare production");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Declare Production</DialogTitle>
          <DialogDescription>
            Load quantities from a recipe, adjust as needed, then declare production to update stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="recipeId">Recipe</Label>
              <select
                id="recipeId"
                {...form.register("recipeId")}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select recipe</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input id="batchNumber" {...form.register("batchNumber")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputQuantity">Produce Qty</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="outputQuantity"
                  type="number"
                  step="0.001"
                  className="flex-1"
                  {...form.register("outputQuantity", { valueAsNumber: true })}
                />
                <span className="shrink-0 text-sm text-muted-foreground min-w-10 text-right">
                  {selectedRecipe?.finishedItem?.uom ?? "—"}
                </span>
              </div>
              {selectedRecipe && (
                <p className="text-[10px] text-muted-foreground">{finishedItemName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputWarehouseId">Finished Good Warehouse</Label>
              <select
                id="outputWarehouseId"
                {...form.register("outputWarehouseId")}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inputWarehouseId">Raw Material Warehouse</Label>
              <select
                id="inputWarehouseId"
                {...form.register("inputWarehouseId")}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} className="resize-none h-16" />
          </div>

          {selectedRecipe && (
            <>
              <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Finished Good (editable)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Finished Good</Label>
                    <Input value={finishedItemName} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Output Qty</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.001"
                        className="flex-1"
                        {...form.register("outputQty", { valueAsNumber: true })}
                      />
                      <span className="shrink-0 text-sm text-muted-foreground min-w-10 text-right">
                        {selectedRecipe.finishedItem?.uom ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Raw Materials Consumed (editable)
                </p>
                {fields.map((field, index) => {
                  const line = selectedRecipe.lines?.[index];
                  return (
                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-6 text-sm truncate">
                        {line?.rawItem?.name ?? "Raw material"}
                      </div>
                      <div className="sm:col-span-6 flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.001"
                          className="flex-1"
                          {...form.register(`inputs.${index}.quantity`, { valueAsNumber: true })}
                        />
                        <span className="shrink-0 text-sm text-muted-foreground min-w-10 text-right">
                          {line?.rawItem?.uom ?? "—"}
                        </span>
                      </div>
                      <input type="hidden" {...form.register(`inputs.${index}.itemId`)} />
                      <input type="hidden" {...form.register(`inputs.${index}.warehouseId`)} />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedRecipe}>
              {isSubmitting ? "Declaring..." : "Declare Production"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
