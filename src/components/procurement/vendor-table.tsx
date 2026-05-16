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
import { MoreHorizontal, Mail, Phone, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Vendor {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface VendorTableProps {
  vendors: Vendor[];
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (id: string) => void;
}

export function VendorTable({ vendors, onEdit, onDelete }: VendorTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[300px]">Vendor Name</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Contact Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => (
            <TableRow key={vendor.id} className="group transition-colors">
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{vendor.name}</span>
                  {vendor.address && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{vendor.address}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{vendor.contactName || "-"}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {vendor.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {vendor.email}
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {vendor.phone}
                    </div>
                  )}
                  {!vendor.email && !vendor.phone && "-"}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Vendor Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit?.(vendor)}>
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(vendor.id)}>
                      Delete Vendor
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
