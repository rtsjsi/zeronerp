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
import { MoreHorizontal, MapPin, Box } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Warehouse {
  id: string;
  name: string;
  code: string;
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
            <TableHead className="w-[200px]">Warehouse Code</TableHead>
            <TableHead>Warehouse Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehouses.map((warehouse) => (
            <TableRow key={warehouse.id} className="group transition-colors">
              <TableCell className="font-mono text-xs font-bold text-primary">
                {warehouse.code}
              </TableCell>
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
                  <DropdownMenuTrigger render={
                    <button className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors outline-none">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  } />
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Warehouse Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(warehouse)}>
                        Edit Warehouse
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(warehouse.id)}>
                      Delete Warehouse
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
