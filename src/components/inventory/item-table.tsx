"use client";

import { Package, MoreVertical, Edit2, Trash2, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Item {
  id: string;
  sku: string;
  name: string;
  uom: string;
  basePrice: any;
  stocks: any[];
  isActive: boolean;
}

interface ItemTableProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  onViewHistory: (item: Item) => void;
}

export function ItemTable({ items, onEdit, onDelete, onViewHistory }: ItemTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Item Details</th>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">Total Stock</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => {
              const totalStock = item.stocks.reduce((acc, s) => acc + Number(s.quantity), 0);
              
              return (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{item.name}</div>
                        <div className="text-[11px] text-muted-foreground uppercase">{item.uom}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{item.sku}</td>
                  <td className="px-6 py-4 font-medium">
                    {totalStock} {item.uom}
                  </td>
                  <td className="px-6 py-4">
                    ₹{Number(item.basePrice).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={item.isActive ? "success" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
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
