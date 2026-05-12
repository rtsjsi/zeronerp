"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ShoppingCart } from "lucide-react";

export default function ProcurementPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Procurement"
        description="Manage suppliers, purchase orders, and goods receipts"
        breadcrumbs={[{ label: "Procurement" }]}
      />
      <EmptyState
        icon={ShoppingCart}
        title="No purchase orders yet"
        description="Create your first purchase order or scan a supplier invoice to get started."
        actionLabel="Create Purchase Order"
        onAction={() => {}}
      />
    </div>
  );
}
