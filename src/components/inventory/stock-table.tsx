"use client";

import { Package, Box, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCategoryLabel, isLowStock } from "@/lib/inventory/item-schema";
import { formatUom, normalizeUomCode } from "@/lib/inventory/constants";

export interface StockItem {
  id: string;
  name: string;
  category: string;
  uom: string;
  reorderLevel: number;
  minStock: number;
  stocks: {
    id: string;
    quantity: number;
    warehouse: {
      id: string;
      name: string;
    };
  }[];
}

interface StockTableProps {
  items: StockItem[];
}

export function StockTable({ items }: StockTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm min-w-0 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[200px]">Item</TableHead>
              <TableHead className="w-[100px]">UOM</TableHead>
              <TableHead className="w-[100px]">Total</TableHead>
              <TableHead className="min-w-[240px]">Warehouse Stock</TableHead>
              <TableHead className="w-[120px]">Reorder / Min</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const totalStock = item.stocks.reduce((acc, s) => acc + Number(s.quantity), 0);
              const lowStock = isLowStock("STOCKABLE", totalStock, item.reorderLevel, item.minStock);
              const uomLabel = normalizeUomCode(item.uom);

              return (
                <TableRow key={item.id} className="group transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{item.name}</div>
                        <Badge variant="outline" className="text-[10px] font-normal mt-1">
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatUom(item.uom)}
                  </TableCell>
                  <TableCell className="font-semibold whitespace-nowrap tabular-nums">
                    {totalStock} {uomLabel}
                  </TableCell>
                  <TableCell>
                    {item.stocks.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No stock recorded</span>
                    ) : (
                      <div className="space-y-1.5">
                        {item.stocks.map((stock) => (
                          <div
                            key={stock.id}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <Box className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                            <span className="font-medium text-foreground">{stock.warehouse.name}</span>
                            <span className="tabular-nums">
                              {Number(stock.quantity)} {uomLabel}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                    {item.reorderLevel > 0 || item.minStock > 0 ? (
                      <span>
                        {item.reorderLevel} / {item.minStock}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {lowStock ? (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Low
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px]">
                        OK
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
