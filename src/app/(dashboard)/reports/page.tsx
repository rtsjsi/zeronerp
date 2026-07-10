"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="animate-fade-in min-w-0">
      <EmptyState
        icon={BarChart3}
        title="No data to report"
        description="Reports will populate automatically as you start creating transactions."
      />
    </div>
  );
}
