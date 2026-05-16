import { Plus, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { BatchList } from "./batch-list";

export default function ProductionPage() {
  return (
    <div className="animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Production"
          description="Batch tracking and material consumption for Edible Oil processing."
          breadcrumbs={[{ label: "Production" }]}
          className="mb-0"
        />
        <Button className="bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-95">
          <Plus className="w-4 h-4 mr-2" /> New Batch
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Active Batches</p>
            <p className="text-2xl font-bold">2</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Yield Efficiency</p>
            <p className="text-2xl font-bold text-emerald-600">94.2%</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Raw Seeds Used</p>
            <p className="text-2xl font-bold">12.5 T</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Recent Batches</h2>
        </div>
        
        <BatchList />
      </div>
    </div>
  );
}
