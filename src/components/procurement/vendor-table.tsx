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
  pan?: string | null;
  gstn?: string | null;
}

interface VendorTableProps {
  vendors: Vendor[];
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (id: string) => void;
}

export function VendorTable({ vendors, onEdit, onDelete }: VendorTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm min-w-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[140px] max-w-[220px]">Vendor Name</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Tax IDs</TableHead>
            <TableHead>Contact Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => (
            <TableRow key={vendor.id} className="group transition-colors">
              <TableCell className="font-medium max-w-[220px]">
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{vendor.name}</span>
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
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {vendor.pan && <span>PAN: {vendor.pan}</span>}
                  {vendor.gstn && <span>GSTN: {vendor.gstn}</span>}
                  {!vendor.pan && !vendor.gstn && "-"}
                </div>
              </TableCell>
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
                  <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors outline-none">
                    <MoreHorizontal className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Vendor Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(vendor)}>
                        Edit Details
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(vendor.id)}>
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
