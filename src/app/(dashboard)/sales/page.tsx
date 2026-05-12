"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt } from "lucide-react";

export default function SalesPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Sales"
        description="Manage customers, sales orders, and invoices"
        breadcrumbs={[{ label: "Sales" }]}
      />
      <EmptyState
        icon={Receipt}
        title="No sales yet"
        description="Create your first sales order or invoice to start tracking revenue."
        actionLabel="Create Sales Order"
        onAction={() => {}}
      />
    </div>
  );
}
