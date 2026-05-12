"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Factory } from "lucide-react";

export default function ProductionPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Production"
        description="Bill of materials, production orders, and batch tracking"
        breadcrumbs={[{ label: "Production" }]}
      />
      <EmptyState
        icon={Factory}
        title="Coming in Phase 2"
        description="Production management including BOM, production orders, batch tracking, yield tracking, and raw material consumption will be available soon."
      />
    </div>
  );
}
