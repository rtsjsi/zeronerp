"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Settings"
        description="Tenant configuration, custom fields, roles, and permissions"
        breadcrumbs={[{ label: "Settings" }]}
      />
      <EmptyState
        icon={Settings}
        title="Settings"
        description="Configuration engine for tenant settings, custom fields, terminology overrides, and role management will be built here."
      />
    </div>
  );
}
