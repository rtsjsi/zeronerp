"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreVertical, Mail, Phone, MapPin, UserCircle, Edit2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Customer {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  pan?: string | null;
  gstn?: string | null;
}

interface CustomerTableProps {
  customers: Customer[];
  onEdit?: (customer: Customer) => void;
  onDelete?: (id: string) => void;
}

export function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm min-w-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[140px] max-w-[220px]">Customer Name</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Tax IDs</TableHead>
            <TableHead>Contact Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} className="group transition-colors">
              <TableCell className="font-medium max-w-[220px]">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserCircle className="w-4 h-4 text-primary/70 shrink-0" />
                    <span className="truncate">{customer.name}</span>
                  </div>
                  {customer.address && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 ml-6">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{customer.address}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{customer.contactName || "-"}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {customer.pan && <span>PAN: {customer.pan}</span>}
                  {customer.gstn && <span>GSTN: {customer.gstn}</span>}
                  {!customer.pan && !customer.gstn && "-"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {customer.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {customer.email}
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </div>
                  )}
                  {!customer.email && !customer.phone && "-"}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors outline-none">
                    <MoreVertical className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(customer)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete?.(customer.id)}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
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
