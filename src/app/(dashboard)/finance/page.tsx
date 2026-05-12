"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendingUp } from "lucide-react";

export default function FinancePage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Finance"
        description="Chart of accounts, journal entries, and GST tracking"
        breadcrumbs={[{ label: "Finance" }]}
      />
      <EmptyState
        icon={TrendingUp}
        title="No accounts set up"
        description="Set up your chart of accounts to start tracking financial transactions."
        actionLabel="Setup Chart of Accounts"
        onAction={() => {}}
      />
    </div>
  );
}
