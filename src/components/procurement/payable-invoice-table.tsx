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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Calendar, User, Warehouse, MoreVertical, Edit2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { normalizeUomCode } from "@/lib/inventory/constants";
import type { PurchaseInvoiceForEdit } from "@/components/procurement/create-invoice-dialog";

export interface PurchaseInvoice {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: string;
  financialYear: string;
  vendor: {
    name: string;
  };
  totalAmount: number;
  createdAt: string;
  status: string;
  items?: {
    id: string;
    itemId: string;
    warehouseId: string;
    quantity: number;
    unitPrice: number;
    gstRate?: number;
    item: {
      name: string;
      uom?: string | null;
    };
    warehouse: {
      name: string;
    };
  }[];
}

interface PayableInvoiceTableProps {
  invoices: PurchaseInvoice[];
  onEdit?: (invoice: PurchaseInvoiceForEdit) => void;
}

function toEditableInvoice(invoice: PurchaseInvoice): PurchaseInvoiceForEdit {
  return {
    id: invoice.id,
    vendorId: invoice.vendorId,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    financialYear: invoice.financialYear,
    items:
      invoice.items?.map((item) => ({
        itemId: item.itemId,
        warehouseId: item.warehouseId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        gstRate: Number(item.gstRate ?? 0),
      })) ?? [],
  };
}

export function PayableInvoiceTable({ invoices, onEdit }: PayableInvoiceTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm min-w-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px]">Invoice No.</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>FY</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Materials Received</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
            {onEdit && <TableHead className="text-right w-[70px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={onEdit ? 8 : 7} className="h-24 text-center text-muted-foreground">
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
                    <span className="font-medium">{invoice.vendor?.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{invoice.financialYear}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(invoice.invoiceDate || invoice.createdAt)}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="space-y-1">
                    {invoice.items?.map((pi) => (
                      <div key={pi.id} className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                        <Warehouse className="w-3 h-3 text-secondary shrink-0" />
                        <span>
                          {pi.quantity}
                          {pi.item?.uom ? ` ${normalizeUomCode(pi.item.uom)}` : ""} × {pi.item?.name} in {pi.warehouse?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-primary">
                  {formatCurrency(invoice.totalAmount)}
                </TableCell>
                <TableCell>
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">
                    Completed & Stocked
                  </Badge>
                </TableCell>
                {onEdit && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors outline-none">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onEdit(toEditableInvoice(invoice))}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
