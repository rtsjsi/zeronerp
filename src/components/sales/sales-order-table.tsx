"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileText, Calendar, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";

interface SalesOrder {
  id: string;
  soNumber: string;
  customer: {
    name: string;
  };
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface SalesOrderTableProps {
  orders: SalesOrder[];
  onViewDetails?: (order: SalesOrder) => void;
  onUpdateStatus?: (id: string, status: string) => void;
}

export function SalesOrderTable({ orders, onViewDetails, onUpdateStatus }: SalesOrderTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "CONFIRMED":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Confirmed</Badge>;
      case "SHIPPED":
        return <Badge className="bg-purple-500 hover:bg-purple-600 text-white border-none">Shipped</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[150px]">SO Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="group transition-colors">
              <TableCell className="font-mono text-xs font-bold">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  {order.soNumber}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">{order.customer.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </TableCell>
              <TableCell className="font-semibold text-primary">
                {formatCurrency(order.totalAmount)}
              </TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <button className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors outline-none">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  } />
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>SO Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onViewDetails && (
                      <DropdownMenuItem onClick={() => onViewDetails(order)}>
                        View Details
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onUpdateStatus?.(order.id, "CONFIRMED")}>
                      Confirm Order
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateStatus?.(order.id, "SHIPPED")}>
                      Mark as Shipped
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onUpdateStatus?.(order.id, "CANCELLED")}>
                      Cancel Order
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
