"use client";

import { Package, MoreVertical, Edit2, Trash2, History, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCategoryLabel, isLowStock } from "@/lib/inventory/item-schema";

interface Item {
  id: string;
  sku: string;
  name: string;
  category: string;
  itemType: string;
  uom: string;
  hsnSacCode?: string | null;
  mrp: number;
  sellingPrice: number;
  basePrice: number;
  reorderLevel: number;
  minStock: number;
  stocks: { quantity: number }[];
  isActive: boolean;
}

interface ItemTableProps {
  items: Item[];
  onEdit?: (item: Item) => void;
  onDelete: (id: string) => void;
  onViewHistory: (item: Item) => void;
}

export function ItemTable({ items, onEdit, onDelete, onViewHistory }: ItemTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm min-w-0 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Item Details</th>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Pricing</th>
              <th className="px-6 py-4">GST</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => {
              const totalStock = item.stocks.reduce((acc, s) => acc + Number(s.quantity), 0);
              const lowStock = isLowStock(item.itemType, totalStock, item.reorderLevel, item.minStock);
              const displayPrice = Number(item.sellingPrice) || Number(item.basePrice);

              return (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">{item.name}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {getCategoryLabel(item.category)}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground uppercase">{item.uom}</span>
                          {lowStock && (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.itemType === "NON_STOCKABLE" ? (
                      <span className="text-muted-foreground text-xs">N/A</span>
                    ) : (
                      <div>
                        <div className="font-medium">
                          {totalStock} {item.uom}
                        </div>
                        {(item.reorderLevel > 0 || item.minStock > 0) && (
                          <div className="text-[10px] text-muted-foreground">
                            Reorder: {item.reorderLevel} · Min: {item.minStock}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">₹{displayPrice.toLocaleString()}</div>
                    {Number(item.mrp) > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        MRP ₹{Number(item.mrp).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs font-mono">{item.hsnSacCode || "—"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={item.isActive ? "success" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors outline-none">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onViewHistory(item)}>
                          <History className="mr-2 h-4 w-4" /> History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(item.id)}
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
