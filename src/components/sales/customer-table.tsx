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
import { MoreHorizontal, Mail, Phone, MapPin, UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Customer {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface CustomerTableProps {
  customers: Customer[];
  onEdit?: (customer: Customer) => void;
  onDelete?: (id: string) => void;
}

export function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[300px]">Customer Name</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Contact Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} className="group transition-colors">
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-primary/70" />
                    <span>{customer.name}</span>
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
                  <DropdownMenuTrigger render={
                    <button className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors outline-none">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  } />
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Customer Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit?.(customer)}>
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(customer.id)}>
                      Delete Customer
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
