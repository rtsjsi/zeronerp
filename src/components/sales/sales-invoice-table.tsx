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
import { FileText, Calendar, User, Warehouse } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  financialYear: string;
  customer: {
    name: string;
  };
  totalAmount: number;
  createdAt: string;
  status: string;
  notes?: string;
  items?: {
    id: string;
    item: {
      name: string;
      sku: string;
    };
    warehouse: {
      name: string;
    };
    quantity: number;
    unitPrice: number;
  }[];
}

interface SalesInvoiceTableProps {
  invoices: SalesInvoice[];
}

export function SalesInvoiceTable({ invoices }: SalesInvoiceTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px]">Invoice No.</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>FY</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Materials Shipped</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No invoices found.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id} className="group transition-colors">
                <TableCell className="font-mono text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    {invoice.invoiceNumber}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium">{invoice.customer?.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{invoice.financialYear}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="space-y-1">
                    {invoice.items?.map((si) => (
                      <div key={si.id} className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                        <Warehouse className="w-3 h-3 text-secondary shrink-0" />
                        <span>{si.quantity} × {si.item?.name} from {si.warehouse?.name}</span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-primary">
                  {formatCurrency(invoice.totalAmount)}
                </TableCell>
                <TableCell>
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">
                    Completed & Shipped
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
