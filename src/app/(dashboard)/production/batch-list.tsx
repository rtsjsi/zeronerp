"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MoreVertical,
  Plus,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function BatchList() {
  const queryClient = useQueryClient();

  const { data: batches, isLoading } = useQuery({
    queryKey: ["production", "batches"],
    queryFn: async () => {
      const res = await fetch("/api/production/batches");
      if (!res.ok) throw new Error("Failed to fetch batches");
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await fetch(`/api/production/batches/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["production", "batches"] });
      toast.success(`Batch ${data.batchNumber} updated`);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
        <p className="text-muted-foreground">No production batches found.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">Draft</Badge>;
      case "IN_PROGRESS": return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">In Progress</Badge>;
      case "COMPLETED": return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
      case "CANCELLED": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {batches.map((batch: any) => (
        <Card key={batch.id} className="overflow-hidden border-border/50 hover:border-primary/20 transition-colors shadow-sm">
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Batch Number</p>
                <CardTitle className="text-base font-bold">{batch.batchNumber}</CardTitle>
              </div>
              {getStatusBadge(batch.status)}
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Started</p>
                <p className="font-medium">{batch.startTime ? format(new Date(batch.startTime), "MMM d, HH:mm") : "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Ended</p>
                <p className="font-medium">{batch.endTime ? format(new Date(batch.endTime), "MMM d, HH:mm") : "-"}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Materials</p>
              {batch.materials?.map((mat: any) => (
                <div key={mat.id} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={mat.type === 'INPUT' ? 'text-amber-600' : 'text-emerald-600'}>
                      {mat.type === 'INPUT' ? '↓' : '↑'}
                    </span>
                    <span className="font-medium truncate max-w-[120px]">{mat.item?.name}</span>
                  </div>
                  <span className="font-mono bg-muted px-1.5 rounded text-[10px]">
                    {mat.quantity} {mat.item?.uom}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              {batch.status === 'DRAFT' && (
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => actionMutation.mutate({ id: batch.id, action: 'START' })}
                  disabled={actionMutation.isPending}
                >
                  <Play className="w-3.5 h-3.5 mr-2" /> Start
                </Button>
              )}
              {batch.status === 'IN_PROGRESS' && (
                <Button 
                  size="sm" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => actionMutation.mutate({ id: batch.id, action: 'COMPLETE' })}
                  disabled={actionMutation.isPending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Complete
                </Button>
              )}
              <Button size="sm" variant="outline" className="px-2">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
