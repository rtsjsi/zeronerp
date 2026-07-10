"use client";

import { Badge } from "@/components/ui/badge";
import { Factory } from "lucide-react";
import { formatUom } from "@/lib/inventory/constants";

interface ProductionBatchRow {
  id: string;
  batchNumber: string;
  status: string;
  createdAt: string;
  notes?: string | null;
  recipe?: { name: string; finishedItem?: { name: string } } | null;
  outputs?: Array<{
    quantity: number;
    recipe?: { name: string } | null;
    item?: { name: string; uom: string };
    materials?: Array<{
      type: string;
      quantity: number;
      item?: { name: string; uom: string };
      warehouse?: { name: string };
    }>;
  }>;
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
              <th className="px-6 py-4">Finished Goods &amp; RM</th>
              <th className="px-6 py-4">Declared</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {batches.map((batch) => {
              const outputLines = batch.outputs?.length
                ? batch.outputs
                : (batch.materials?.filter((m) => m.type === "OUTPUT") ?? []).map((line) => ({
                    quantity: line.quantity,
                    item: line.item,
                    recipe: batch.recipe,
                    materials: batch.materials?.filter((m) => m.type === "INPUT"),
                  }));

              return (
                <tr key={batch.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                        <Factory className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">{batch.batchNumber}</div>
                        {batch.notes && (
                          <div className="text-[10px] text-muted-foreground">{batch.notes}</div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {outputLines.length > 1
                            ? `${outputLines.length} finished goods`
                            : (outputLines[0]?.item?.name ?? batch.recipe?.finishedItem?.name ?? "Production batch")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-3">
                      {outputLines.map((output, idx) => {
                        const inputs =
                          output.materials?.filter((m) => m.type === "INPUT") ??
                          batch.materials?.filter((m) => m.type === "INPUT") ??
                          [];

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="text-sm font-medium text-emerald-700">
                              + {output.quantity} {formatUom(output.item?.uom)} {output.item?.name}
                            </div>
                            <div className="pl-3 border-l border-muted space-y-0.5">
                              {inputs.map((line, inputIdx) => (
                                <div key={inputIdx} className="text-xs text-red-600">
                                  − {line.quantity} {formatUom(line.item?.uom)} {line.item?.name}
                                  {line.warehouse?.name ? ` (${line.warehouse.name})` : ""}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap align-top">
                    {new Date(batch.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 align-top">
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
