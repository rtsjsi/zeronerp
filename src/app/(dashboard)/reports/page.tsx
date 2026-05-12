"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        description="Stock summary, sales register, purchase register, and GST reports"
        breadcrumbs={[{ label: "Reports" }]}
      />
      <EmptyState
        icon={BarChart3}
        title="No data to report"
        description="Reports will populate automatically as you start creating transactions."
      />
    </div>
  );
}
