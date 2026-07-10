"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreVertical, MapPin, Box, Edit2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Warehouse {
  id: string;
  name: string;
  location?: string | null;
}

interface WarehouseTableProps {
  warehouses: Warehouse[];
  onEdit?: (warehouse: Warehouse) => void;
  onDelete?: (id: string) => void;
}

export function WarehouseTable({ warehouses, onEdit, onDelete }: WarehouseTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm min-w-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Warehouse Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehouses.map((warehouse) => (
            <TableRow key={warehouse.id} className="group transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-muted-foreground" />
                  <span>{warehouse.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {warehouse.location || "No location specified"}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors outline-none">
                    <MoreVertical className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(warehouse)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete?.(warehouse.id)}
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
