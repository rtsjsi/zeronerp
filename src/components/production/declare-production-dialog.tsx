"use client";

import { useEffect, useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
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
import { formatUom } from "@/lib/inventory/constants";
import { ItemSelect } from "@/components/shared/item-select";
import { SearchableLovSelect } from "@/components/shared/searchable-lov-select";

const inputLineSchema = z.object({
  itemId: z.string().min(1, "Select a raw material"),
  quantity: z.number().positive("Quantity must be greater than zero"),
});

const outputLineSchema = z.object({
  recipeId: z.string().min(1, "Select a recipe"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  inputs: z.array(inputLineSchema).min(1, "Add at least one raw material"),
});

const declareSchema = z.object({
  batchNumber: z.string().trim().min(1, "Batch number is required"),
  notes: z.string().optional(),
  outputWarehouseId: z.string().min(1, "Select finished good warehouse"),
  inputWarehouseId: z.string().min(1, "Select raw material warehouse"),
  outputs: z.array(outputLineSchema).min(1, "Add at least one finished good line"),
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

function buildInputsForOutput(recipeId: string, quantity: number, recipes: any[]) {
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe || !quantity) return [];

  const basis = Number(recipe.outputQuantity) || 1;
  const factor = quantity / basis;

  return (recipe.lines ?? []).map((line: any) => ({
    itemId: line.rawItemId,
    quantity: Number((Number(line.quantity) * factor).toFixed(3)),
  }));
}

function FgOutputLine({
  index,
  control,
  register,
  recipeOptions,
  inventoryItems,
  canRemove,
  onRemove,
  onSyncInputs,
  getRecipe,
  getItemUom,
}: {
  index: number;
  control: Control<DeclareFormValues>;
  register: UseFormRegister<DeclareFormValues>;
  recipeOptions: { value: string; label: string }[];
  inventoryItems: any[];
  canRemove: boolean;
  onRemove: () => void;
  onSyncInputs: () => void;
  getRecipe: (recipeId: string) => any | undefined;
  getItemUom: (itemId: string) => string;
}) {
  const recipeId = useWatch({ control, name: `outputs.${index}.recipeId` }) ?? "";
  const recipe = getRecipe(recipeId);

  const {
    fields: inputFields,
    append: appendInput,
    remove: removeInput,
  } = useFieldArray({
    control,
    name: `outputs.${index}.inputs`,
  });

  const inputValues = useWatch({ control, name: `outputs.${index}.inputs` }) ?? [];

  return (
    <div className="rounded-lg border border-border/80 p-3 space-y-3 bg-background/60">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
        <div className="sm:col-span-5 space-y-1">
          <Label className="text-xs">Recipe / FG</Label>
          <Controller
            name={`outputs.${index}.recipeId`}
            control={control}
            render={({ field }) => (
              <SearchableLovSelect
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setTimeout(onSyncInputs, 0);
                }}
                options={recipeOptions}
                placeholder="Select recipe"
                searchPlaceholder="Search recipes..."
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
              {...register(`outputs.${index}.quantity`, { valueAsNumber: true })}
              onBlur={onSyncInputs}
            />
            <span className="shrink-0 text-sm text-muted-foreground min-w-10 text-right">
              {formatUom(recipe?.finishedItem?.uom)}
            </span>
          </div>
        </div>
        <div className="sm:col-span-1 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canRemove}
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 pl-2 border-l-2 border-muted">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Raw Materials for this FG
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 h-7 text-xs"
            onClick={() => appendInput({ itemId: "", quantity: 1 })}
          >
            <Plus className="w-3 h-3" /> Add RM
          </Button>
        </div>

        {inputFields.length === 0 && (
          <p className="text-xs text-muted-foreground">Select a recipe to load raw materials.</p>
        )}

        {inputFields.map((field, inputIndex) => (
          <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
            <div className="sm:col-span-6 space-y-1">
              <Controller
                name={`outputs.${index}.inputs.${inputIndex}.itemId`}
                control={control}
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
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.001"
                  placeholder="Qty"
                  className="flex-1"
                  {...register(`outputs.${index}.inputs.${inputIndex}.quantity`, {
                    valueAsNumber: true,
                  })}
                />
                <span className="shrink-0 text-sm text-muted-foreground min-w-10 text-right">
                  {getItemUom(inputValues?.[inputIndex]?.itemId ?? "")}
                </span>
              </div>
            </div>
            <div className="sm:col-span-1 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={inputFields.length === 1}
                onClick={() => removeInput(inputIndex)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
      outputs: [{ recipeId: "", quantity: 1, inputs: [] }],
    },
  });

  const { fields: outputFields, append: appendOutput, remove: removeOutput } = useFieldArray({
    control: form.control,
    name: "outputs",
  });

  const recipeOptions = recipes.map((recipe) => ({
    value: recipe.id,
    label: `${recipe.name} (${recipe.finishedItem?.name ?? "FG"})`,
  }));

  function getRecipe(recipeId: string) {
    return recipes.find((recipe) => recipe.id === recipeId);
  }

  function getItemUom(itemId: string) {
    const code = inventoryItems.find((item) => item.id === itemId)?.uom;
    return formatUom(code);
  }

  function syncOutputInputs(index: number) {
    const output = form.getValues(`outputs.${index}`);
    const nextInputs = buildInputsForOutput(output.recipeId, output.quantity, recipes);
    form.setValue(`outputs.${index}.inputs`, nextInputs, { shouldValidate: true });
  }

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

      const initialInputs = initialRecipeId
        ? buildInputsForOutput(initialRecipeId, 1, activeRecipes)
        : [];

      form.reset({
        batchNumber: makeBatchNumber(),
        notes: "",
        outputWarehouseId: defaultWh,
        inputWarehouseId: defaultWh,
        outputs: [{ recipeId: initialRecipeId, quantity: 1, inputs: initialInputs }],
      });
    };

    load();
  }, [open, form]);

  async function onSubmit(data: DeclareFormValues) {
    setIsSubmitting(true);
    try {
      const uniqueRecipeIds = [...new Set(data.outputs.map((line) => line.recipeId))];
      const recipeId = uniqueRecipeIds.length === 1 ? uniqueRecipeIds[0] : undefined;

      const res = await apiFetch("/api/production/declare", {
        method: "POST",
        body: JSON.stringify({
          recipeId,
          batchNumber: data.batchNumber,
          notes: data.notes,
          outputWarehouseId: data.outputWarehouseId,
          inputWarehouseId: data.inputWarehouseId,
          outputs: data.outputs,
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Declare Production</DialogTitle>
          <DialogDescription>
            Declare finished goods under one batch. Each FG line has its own raw materials, linked
            for stock and history reporting.
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

          <div className="space-y-3">
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
                  const recipeId = defaultRecipeId(recipes);
                  appendOutput({
                    recipeId,
                    quantity: 1,
                    inputs: buildInputsForOutput(recipeId, 1, recipes),
                  });
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

            {outputFields.map((field, index) => (
              <FgOutputLine
                key={field.id}
                index={index}
                control={form.control}
                register={form.register}
                recipeOptions={recipeOptions}
                inventoryItems={inventoryItems}
                canRemove={outputFields.length > 1}
                onRemove={() => removeOutput(index)}
                onSyncInputs={() => syncOutputInputs(index)}
                getRecipe={getRecipe}
                getItemUom={getItemUom}
              />
            ))}
            {form.formState.errors.outputs && (
              <p className="text-[10px] text-destructive">
                {form.formState.errors.outputs.message ||
                  form.formState.errors.outputs.root?.message}
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
