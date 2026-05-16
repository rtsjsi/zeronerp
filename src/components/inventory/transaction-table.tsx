"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoveDown, MoveUp, ArrowRightLeft, Clock } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  reference?: string | null;
  createdAt: string;
  item: {
    name: string;
    sku: string;
  };
  warehouse: {
    name: string;
    code: string;
  };
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const getBadge = (type: string) => {
    switch (type) {
      case "IN":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">
            <MoveDown className="w-3 h-3 mr-1" /> Stock In
          </Badge>
        );
      case "OUT":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20">
            <MoveUp className="w-3 h-3 mr-1" /> Stock Out
          </Badge>
        );
      case "MOVE":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20">
            <ArrowRightLeft className="w-3 h-3 mr-1" /> Transfer
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px]">Date & Time</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Reference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id} className="group transition-colors">
              <TableCell className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(tx.createdAt).toLocaleString()}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{tx.item.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{tx.item.sku}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{tx.warehouse.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{tx.warehouse.code}</span>
                </div>
              </TableCell>
              <TableCell>{getBadge(tx.type)}</TableCell>
              <TableCell className={`text-right font-mono font-bold ${tx.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>
                {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground italic">
                {tx.reference || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
