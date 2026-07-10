"use client";

import { useCallback, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
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
import { ItemSelect } from "@/components/shared/item-select";
import { SearchableLovSelect } from "@/components/shared/searchable-lov-select";

const outputLineSchema = z.object({
  recipeId: z.string().min(1, "Select a recipe"),
  quantity: z.number().positive("Quantity must be greater than zero"),
});

const inputLineSchema = z.object({
  itemId: z.string().min(1, "Select a raw material"),
  warehouseId: z.string().min(1),
  quantity: z.number().positive("Quantity must be greater than zero"),
});

const declareSchema = z.object({
  batchNumber: z.string().trim().min(1, "Batch number is required"),
  notes: z.string().optional(),
  outputWarehouseId: z.string().min(1, "Select finished good warehouse"),
  inputWarehouseId: z.string().min(1, "Select raw material warehouse"),
  outputs: z.array(outputLineSchema).min(1, "Add at least one finished good line"),
  inputs: z.array(inputLineSchema).min(1, "Add at least one raw material line"),
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

function defaultRecipeId(recipes: any[]) {
  return recipes.length === 1 ? recipes[0].id : "";
}

function buildInputsFromOutputs(
  outputs: { recipeId: string; quantity: number }[],
  recipes: any[],
  warehouseId: string,
) {
  const merged = new Map<string, number>();

  for (const output of outputs) {
    const recipe = recipes.find((r) => r.id === output.recipeId);
    if (!recipe || !output.quantity) continue;

    const basis = Number(recipe.outputQuantity) || 1;
    const factor = output.quantity / basis;

    for (const line of recipe.lines ?? []) {
      const qty = Number((Number(line.quantity) * factor).toFixed(3));
      merged.set(line.rawItemId, (merged.get(line.rawItemId) ?? 0) + qty);
    }
  }

  return Array.from(merged.entries()).map(([itemId, quantity]) => ({
    itemId,
    warehouseId,
    quantity: Number(quantity.toFixed(3)),
  }));
}

export function DeclareProductionDialog({
  open,
  onOpenChange,
  onSuccess,
}: DeclareProductionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  const form = useForm<DeclareFormValues>({
    resolver: zodResolver(declareSchema),
    defaultValues: {
      batchNumber: makeBatchNumber(),
      notes: "",
      outputWarehouseId: "",
      inputWarehouseId: "",
      outputs: [{ recipeId: "", quantity: 1 }],
      inputs: [],
    },
  });

  const {
    fields: outputFields,
    append: appendOutput,
    remove: removeOutput,
  } = useFieldArray({ control: form.control, name: "outputs" });

  const {
    fields: inputFields,
    append: appendInput,
    remove: removeInput,
    replace: replaceInputs,
  } = useFieldArray({ control: form.control, name: "inputs" });

  const outputs = form.watch("outputs");
  const inputWarehouseId = form.watch("inputWarehouseId");
  const inputValues = form.watch("inputs");

  const recipeOptions = recipes.map((recipe) => ({
    value: recipe.id,
    label: `${recipe.name} (${recipe.finishedItem?.name ?? "FG"})`,
  }));

  const syncInputsFromOutputs = useCallback(() => {
    const currentOutputs = form.getValues("outputs");
    const warehouseId = form.getValues("inputWarehouseId") || warehouses[0]?.id || "";
    const hasValidOutput = currentOutputs.some((line) => line.recipeId && line.quantity > 0);

    if (!hasValidOutput) {
      replaceInputs([]);
      return;
    }

    const nextInputs = buildInputsFromOutputs(currentOutputs, recipes, warehouseId);
    replaceInputs(nextInputs);
  }, [form, recipes, warehouses, replaceInputs]);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const [recipesRes, warehousesRes, itemsRes] = await Promise.all([
        apiFetch<any[]>("/api/production/recipes"),
        apiFetch<any[]>("/api/inventory/warehouses"),
        apiFetch<any[]>("/api/inventory/items"),
      ]);

      const activeRecipes =
        recipesRes.success && recipesRes.data
          ? recipesRes.data.filter((r) => r.isActive)
          : [];
      const loadedWarehouses = warehousesRes.success ? warehousesRes.data ?? [] : [];
      const defaultWh = loadedWarehouses[0]?.id ?? "";
      const initialRecipeId = defaultRecipeId(activeRecipes);

      setRecipes(activeRecipes);
      setWarehouses(loadedWarehouses);
      if (itemsRes.success && itemsRes.data) {
        setInventoryItems(itemsRes.data);
      }

      form.reset({
        batchNumber: makeBatchNumber(),
        notes: "",
        outputWarehouseId: defaultWh,
        inputWarehouseId: defaultWh,
        outputs: [{ recipeId: initialRecipeId, quantity: 1 }],
        inputs: [],
      });

      if (initialRecipeId) {
        const nextInputs = buildInputsFromOutputs(
          [{ recipeId: initialRecipeId, quantity: 1 }],
          activeRecipes,
          defaultWh,
        );
        replaceInputs(nextInputs);
      } else {
        replaceInputs([]);
      }
    };

    load();
  }, [open, form, replaceInputs]);

  useEffect(() => {
    if (!inputWarehouseId) return;
    const current = form.getValues("inputs");
    if (!current.length) return;
    replaceInputs(current.map((line) => ({ ...line, warehouseId: inputWarehouseId })));
  }, [inputWarehouseId, form, replaceInputs]);

  function getRecipe(recipeId: string) {
    return recipes.find((recipe) => recipe.id === recipeId);
  }

  function getItemUom(itemId: string) {
    return inventoryItems.find((item) => item.id === itemId)?.uom ?? "—";
  }

  async function onSubmit(data: DeclareFormValues) {
    setIsSubmitting(true);
    try {
      const materials = [
        ...data.outputs.map((line) => {
          const recipe = getRecipe(line.recipeId);
          if (!recipe) throw new Error("Selected recipe not found");
          return {
            itemId: recipe.finishedItemId,
            warehouseId: data.outputWarehouseId,
            type: "OUTPUT" as const,
            quantity: line.quantity,
          };
        }),
        ...data.inputs.map((line) => ({
          itemId: line.itemId,
          warehouseId: line.warehouseId,
          type: "INPUT" as const,
          quantity: line.quantity,
        })),
      ];

      const uniqueRecipeIds = [...new Set(data.outputs.map((line) => line.recipeId))];
      const recipeId = uniqueRecipeIds.length === 1 ? uniqueRecipeIds[0] : undefined;

      const res = await apiFetch("/api/production/declare", {
        method: "POST",
        body: JSON.stringify({
          recipeId,
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasRecipes = recipes.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Declare Production</DialogTitle>
          <DialogDescription>
            Declare one or more finished goods under a single batch. Raw materials default from
            recipes and can be edited before stock is updated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input id="batchNumber" {...form.register("batchNumber")} />
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

          <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Finished Goods
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={!hasRecipes}
                onClick={() => {
                  appendOutput({ recipeId: defaultRecipeId(recipes), quantity: 1 });
                  setTimeout(() => syncInputsFromOutputs(), 0);
                }}
              >
                <Plus className="w-3.5 h-3.5" /> Add FG Line
              </Button>
            </div>

            {!hasRecipes && (
              <p className="text-xs text-muted-foreground">
                Create an active recipe before declaring production.
              </p>
            )}

            {outputFields.map((field, index) => {
              const recipe = getRecipe(outputs?.[index]?.recipeId ?? "");
              return (
                <div
                  key={field.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border-b border-border/60 pb-3 last:border-0 last:pb-0"
                >
                  <div className="sm:col-span-5 space-y-1">
                    <Label className="text-xs">Recipe / FG</Label>
                    <Controller
                      name={`outputs.${index}.recipeId`}
                      control={form.control}
                      render={({ field: recipeField }) => (
                        <SearchableLovSelect
                          value={recipeField.value}
                          onValueChange={(value) => {
                            recipeField.onChange(value);
                            setTimeout(() => syncInputsFromOutputs(), 0);
                          }}
                          options={recipeOptions}
                          placeholder="Select recipe"
                          searchPlaceholder="Search recipes..."
                          disabled={!hasRecipes}
                        />
                      )}
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-xs">Finished Good</Label>
                    <Input value={recipe?.finishedItem?.name ?? "—"} disabled />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-xs">Output Qty</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.001"
                        className="flex-1"
                        {...form.register(`outputs.${index}.quantity`, { valueAsNumber: true })}
                        onBlur={() => syncInputsFromOutputs()}
                      />
                      <span className="shrink-0 text-sm text-muted-foreground min-w-10 text-right">
                        {recipe?.finishedItem?.uom ?? "—"}
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={outputFields.length === 1}
                      onClick={() => {
                        removeOutput(index);
                        setTimeout(() => syncInputsFromOutputs(), 0);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {form.formState.errors.outputs && (
              <p className="text-[10px] text-destructive">
                {form.formState.errors.outputs.message ||
                  form.formState.errors.outputs.root?.message}
              </p>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Raw Materials Consumed
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() =>
                  appendInput({
                    itemId: "",
                    warehouseId: inputWarehouseId || warehouses[0]?.id || "",
                    quantity: 1,
                  })
                }
              >
                <Plus className="w-3.5 h-3.5" /> Add RM Line
              </Button>
            </div>

            {inputFields.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Select a recipe on a finished good line to load raw materials.
              </p>
            )}

            {inputFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-6 space-y-1">
                  <Label className="text-xs">Raw Material</Label>
                  <Controller
                    name={`inputs.${index}.itemId`}
                    control={form.control}
                    render={({ field: itemField }) => (
                      <ItemSelect
                        value={itemField.value}
                        onValueChange={itemField.onChange}
                        items={inventoryItems}
                        placeholder="Select raw material"
                        searchPlaceholder="Search items..."
                        showUom={false}
                      />
                    )}
                  />
                </div>
                <div className="sm:col-span-5 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.001"
                      className="flex-1"
                      {...form.register(`inputs.${index}.quantity`, { valueAsNumber: true })}
                    />
                    <span className="shrink-0 text-sm text-muted-foreground min-w-10 text-right">
                      {getItemUom(inputValues?.[index]?.itemId ?? "")}
                    </span>
                  </div>
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={inputFields.length === 1}
                    onClick={() => removeInput(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <input type="hidden" {...form.register(`inputs.${index}.warehouseId`)} />
              </div>
            ))}
            {form.formState.errors.inputs && (
              <p className="text-[10px] text-destructive">
                {form.formState.errors.inputs.message || form.formState.errors.inputs.root?.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !hasRecipes}>
              {isSubmitting ? "Declaring..." : "Declare Production"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
