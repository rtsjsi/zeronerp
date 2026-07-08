"use client";

import { Badge } from "@/components/ui/badge";
import { Factory } from "lucide-react";

interface ProductionBatchRow {
  id: string;
  batchNumber: string;
  status: string;
  createdAt: string;
  notes?: string | null;
  recipe?: { name: string; finishedItem?: { name: string } } | null;
  materials?: Array<{
    type: string;
    quantity: number;
    item?: { name: string; uom: string };
    warehouse?: { name: string };
  }>;
}

interface ProductionBatchTableProps {
  batches: ProductionBatchRow[];
}

export function ProductionBatchTable({ batches }: ProductionBatchTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm min-w-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Batch</th>
              <th className="px-6 py-4">Recipe / Output</th>
              <th className="px-6 py-4">Materials</th>
              <th className="px-6 py-4">Declared</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {batches.map((batch) => {
              const outputs = batch.materials?.filter((m) => m.type === "OUTPUT") ?? [];
              const inputs = batch.materials?.filter((m) => m.type === "INPUT") ?? [];

              return (
                <tr key={batch.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                        <Factory className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">{batch.batchNumber}</div>
                        {batch.notes && (
                          <div className="text-[10px] text-muted-foreground">{batch.notes}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{batch.recipe?.name ?? "Manual"}</div>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {outputs.map((line, idx) => (
                        <div key={idx} className="text-emerald-700">
                          + {line.quantity} {line.item?.uom} {line.item?.name}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {inputs.map((line, idx) => (
                        <div key={idx} className="text-red-600">
                          − {line.quantity} {line.item?.uom} {line.item?.name}
                          {line.warehouse?.name ? ` (${line.warehouse.name})` : ""}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(batch.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={batch.status === "COMPLETED" ? "success" : "secondary"}>
                      {batch.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
