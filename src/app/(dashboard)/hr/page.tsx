"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

export default function HRPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="HR"
        description="Employee management, attendance, leave, and payroll"
        breadcrumbs={[{ label: "HR" }]}
      />
      <EmptyState
        icon={Users}
        title="Coming in Phase 2"
        description="HR management including employee master, attendance tracking, leave management, and basic payroll will be available soon."
      />
    </div>
  );
}
