"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { ItemSelect, type ItemOption } from "@/components/shared/item-select";
import { LovSelect } from "@/components/shared/lov-select";
import { UomField } from "@/components/shared/uom-field";

const inputLineSchema = z.object({
  itemId: z.string().min(1, "Select a raw material"),
  warehouseId: z.string().min(1, "Select warehouse"),
  quantity: z.number().positive("Quantity must be greater than zero"),
});

const outputLineSchema = z.object({
  finishedItemId: z.string().min(1, "Select a finished good"),
  warehouseId: z.string().min(1, "Select warehouse"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  inputs: z.array(inputLineSchema).min(1, "Add at least one raw material"),
});

const declareSchema = z.object({
  batchNumber: z.string().trim().min(1, "Batch number is required"),
  outputs: z.array(outputLineSchema).min(1, "Add at least one finished good line"),
});

type DeclareFormValues = z.infer<typeof declareSchema>;
type DeclareInputLine = z.infer<typeof inputLineSchema>;

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

function finishedGoodOptions(recipes: any[]): ItemOption[] {
  const seen = new Set<string>();
  const options: ItemOption[] = [];

  for (const recipe of recipes) {
    if (!recipe.finishedItem || seen.has(recipe.finishedItemId)) continue;
    seen.add(recipe.finishedItemId);
    options.push({
      id: recipe.finishedItemId,
      name: recipe.finishedItem.name,
      uom: recipe.finishedItem.uom,
    });
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}

function getRecipeForFg(recipes: any[], finishedItemId: string) {
  return recipes.find((recipe) => recipe.finishedItemId === finishedItemId);
}

function buildInputsForOutput(
  finishedItemId: string,
  quantity: number,
  recipes: any[],
  warehouseId: string,
): DeclareInputLine[] {
  const recipe = getRecipeForFg(recipes, finishedItemId);
  if (!recipe || !quantity) return [];

  const basis = Number(recipe.outputQuantity) || 1;
  const factor = quantity / basis;

  return (recipe.lines ?? []).map((line: any) => ({
    itemId: line.rawItemId,
    warehouseId,
    quantity: Number((Number(line.quantity) * factor).toFixed(3)),
  }));
}

function warehouseOptions(warehouses: any[]) {
  return warehouses.map((w) => ({ value: w.id, label: w.name }));
}

function FgOutputLine({
  index,
  control,
  register,
  finishedGoods,
  inventoryItems,
  recipes,
  warehouses,
  defaultWarehouseId,
  canRemove,
  onRemove,
  onSyncInputs,
}: {
  index: number;
  control: Control<DeclareFormValues>;
  register: UseFormRegister<DeclareFormValues>;
  finishedGoods: ItemOption[];
  inventoryItems: any[];
  recipes: any[];
  warehouses: any[];
  defaultWarehouseId: string;
  canRemove: boolean;
  onRemove: () => void;
  onSyncInputs: () => void;
}) {
  const finishedItemId = useWatch({ control, name: `outputs.${index}.finishedItemId` }) ?? "";
  const recipe = getRecipeForFg(recipes, finishedItemId);
  const whOptions = warehouseOptions(warehouses);

  const {
    fields: inputFields,
    append: appendInput,
    remove: removeInput,
  } = useFieldArray({
    control,
    name: `outputs.${index}.inputs`,
  });

  const inputValues = useWatch({ control, name: `outputs.${index}.inputs` }) ?? [];

  function getItemUom(itemId: string) {
    return inventoryItems.find((item) => item.id === itemId)?.uom ?? null;
  }

  return (
    <div className="rounded-lg border border-border/80 p-3 space-y-3 bg-background/60">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
        <div className="sm:col-span-4 space-y-2 min-w-0">
          <Label className="sm:hidden">Finished Good</Label>
          <Controller
            name={`outputs.${index}.finishedItemId`}
            control={control}
            render={({ field }) => (
              <ItemSelect
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setTimeout(onSyncInputs, 0);
                }}
                items={finishedGoods}
                placeholder="Select finished good"
                searchPlaceholder="Search finished goods..."
                showUom={false}
              />
            )}
          />
        </div>
        <div className="sm:col-span-3 space-y-2 min-w-0">
          <Label className="sm:hidden">FG Warehouse</Label>
          <Controller
            name={`outputs.${index}.warehouseId`}
            control={control}
            render={({ field }) => (
              <LovSelect
                value={field.value}
                onValueChange={field.onChange}
                options={whOptions}
                placeholder="Warehouse"
                className="w-full"
              />
            )}
          />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label className="sm:hidden">UOM</Label>
          <UomField value={recipe?.finishedItem?.uom} compact />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label className="sm:hidden">Output Qty</Label>
          <Input
            type="number"
            step="0.001"
            {...register(`outputs.${index}.quantity`, { valueAsNumber: true })}
            onBlur={onSyncInputs}
          />
        </div>
        <div className="sm:col-span-1 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
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
            className="gap-1 h-8"
            onClick={() => appendInput({ itemId: "", warehouseId: defaultWarehouseId, quantity: 1 })}
          >
            <Plus className="w-3 h-3" /> Add RM
          </Button>
        </div>

        {inputFields.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Select a finished good to load raw materials from its recipe.
          </p>
        )}

        {inputFields.length > 0 && (
          <div className="hidden sm:grid sm:grid-cols-12 gap-2">
            <Label className="sm:col-span-4">Raw Material</Label>
            <Label className="sm:col-span-3">RM Warehouse</Label>
            <Label className="sm:col-span-2">UOM</Label>
            <Label className="sm:col-span-2">Qty</Label>
            <div className="sm:col-span-1" />
          </div>
        )}

        {inputFields.map((field, inputIndex) => (
          <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <div className="sm:col-span-4 space-y-2 min-w-0">
              <Label className="sm:hidden">Raw Material</Label>
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
            <div className="sm:col-span-3 space-y-2 min-w-0">
              <Label className="sm:hidden">RM Warehouse</Label>
              <Controller
                name={`outputs.${index}.inputs.${inputIndex}.warehouseId`}
                control={control}
                render={({ field: whField }) => (
                  <LovSelect
                    value={whField.value}
                    onValueChange={whField.onChange}
                    options={whOptions}
                    placeholder="Warehouse"
                    className="w-full"
                  />
                )}
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label className="sm:hidden">UOM</Label>
              <UomField value={getItemUom(inputValues?.[inputIndex]?.itemId ?? "")} compact />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label className="sm:hidden">Qty</Label>
              <Input
                type="number"
                step="0.001"
                placeholder="Qty"
                {...register(`outputs.${index}.inputs.${inputIndex}.quantity`, {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="sm:col-span-1 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
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
      outputs: [{ finishedItemId: "", warehouseId: "", quantity: 1, inputs: [] }],
    },
  });

  const { fields: outputFields, append: appendOutput, remove: removeOutput } = useFieldArray({
    control: form.control,
    name: "outputs",
  });

  const finishedGoods = useMemo(() => finishedGoodOptions(recipes), [recipes]);

  function syncOutputInputs(index: number) {
    const output = form.getValues(`outputs.${index}`);
    const existingByItem = new Map(
      (output.inputs ?? []).map((input: DeclareInputLine) => [input.itemId, input.warehouseId]),
    );
    const rmWarehouseId = output.inputs?.[0]?.warehouseId || defaultWarehouseId;
    const built = buildInputsForOutput(
      output.finishedItemId,
      output.quantity,
      recipes,
      rmWarehouseId,
    );
    const nextInputs = built.map((input: DeclareInputLine) => ({
      ...input,
      warehouseId: existingByItem.get(input.itemId) ?? input.warehouseId,
    }));
    form.setValue(`outputs.${index}.inputs`, nextInputs, { shouldValidate: true });
  }

  const defaultWarehouseId = warehouses[0]?.id ?? "";

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
      const fgOptions = finishedGoodOptions(activeRecipes);
      const initialFinishedItemId = fgOptions[0]?.id ?? "";
      const initialInputs = initialFinishedItemId
        ? buildInputsForOutput(initialFinishedItemId, 1, activeRecipes, defaultWh)
        : [];

      setRecipes(activeRecipes);
      setWarehouses(loadedWarehouses);
      if (itemsRes.success && itemsRes.data) {
        setInventoryItems(itemsRes.data);
      }

      form.reset({
        batchNumber: makeBatchNumber(),
        outputs: [
          {
            finishedItemId: initialFinishedItemId,
            warehouseId: defaultWh,
            quantity: 1,
            inputs: initialInputs,
          },
        ],
      });
    };

    load();
  }, [open, form]);

  async function onSubmit(data: DeclareFormValues) {
    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/production/declare", {
        method: "POST",
        body: JSON.stringify(data),
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

  const hasRecipes = finishedGoods.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[920px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Declare Production</DialogTitle>
          <DialogDescription>
            Select finished goods to produce. Raw materials load automatically from each item&apos;s
            recipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="batchNumber">Batch Number</Label>
            <Input
              id="batchNumber"
              readOnly
              disabled
              className="bg-muted/50"
              {...form.register("batchNumber")}
            />
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
                className="gap-1 h-8"
                disabled={!hasRecipes}
                onClick={() => {
                  const finishedItemId = finishedGoods[0]?.id ?? "";
                  appendOutput({
                    finishedItemId,
                    warehouseId: defaultWarehouseId,
                    quantity: 1,
                    inputs: buildInputsForOutput(
                      finishedItemId,
                      1,
                      recipes,
                      defaultWarehouseId,
                    ),
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

            {hasRecipes && (
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-0">
                <Label className="sm:col-span-4">Finished Good</Label>
                <Label className="sm:col-span-3">FG Warehouse</Label>
                <Label className="sm:col-span-2">UOM</Label>
                <Label className="sm:col-span-2">Output Qty</Label>
                <div className="sm:col-span-1" />
              </div>
            )}

            {outputFields.map((field, index) => (
              <FgOutputLine
                key={field.id}
                index={index}
                control={form.control}
                register={form.register}
                finishedGoods={finishedGoods}
                inventoryItems={inventoryItems}
                recipes={recipes}
                warehouses={warehouses}
                defaultWarehouseId={defaultWarehouseId}
                canRemove={outputFields.length > 1}
                onRemove={() => removeOutput(index)}
                onSyncInputs={() => syncOutputInputs(index)}
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
