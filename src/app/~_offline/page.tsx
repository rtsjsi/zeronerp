"use client";

import { WifiOff } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function OfflinePage() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full">
        <EmptyState
          icon={WifiOff}
          title="You are offline"
          description="It looks like you've lost your internet connection. Some features of ZeronERP require an active connection, but you can still view cached data."
          actionLabel="Try again"
          onAction={() => window.location.reload()}
        />
      </div>
    </div>
  );
}
