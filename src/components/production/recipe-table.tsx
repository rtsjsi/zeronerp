"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit2, Trash2, FlaskConical } from "lucide-react";
import { formatUom } from "@/lib/inventory/constants";

export interface RecipeRow {
  id: string;
  name: string;
  outputQuantity: number;
  isActive: boolean;
  finishedItem?: { name: string; uom: string };
  lines?: Array<{ quantity: number; rawItem?: { name: string; uom: string } }>;
}

interface RecipeTableProps {
  recipes: RecipeRow[];
  onEdit: (recipe: RecipeRow) => void;
  onDelete: (id: string) => void;
}

export function RecipeTable({ recipes, onEdit, onDelete }: RecipeTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm min-w-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Finished Good</th>
              <th className="px-6 py-4">Output Qty</th>
              <th className="px-6 py-4">Raw Materials</th>
              <th className="px-6 py-4">RM Qty</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recipes.map((recipe) => (
              <tr key={recipe.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">{recipe.finishedItem?.name ?? "—"}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {recipe.outputQuantity} {formatUom(recipe.finishedItem?.uom)}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {recipe.lines?.map((line, idx) => (
                      <div key={idx} className="text-xs">
                        {line.rawItem?.name ?? "—"}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {recipe.lines?.map((line, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground whitespace-nowrap">
                        {line.quantity} {formatUom(line.rawItem?.uom)}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={recipe.isActive ? "success" : "secondary"}>
                    {recipe.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors outline-none">
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onEdit(recipe)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(recipe.id)}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
