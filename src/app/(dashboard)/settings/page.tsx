"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="animate-fade-in min-w-0">
      <EmptyState
        icon={Settings}
        title="Settings"
        description="Configuration engine for tenant settings, custom fields, terminology overrides, and role management will be built here."
      />
    </div>
  );
}
