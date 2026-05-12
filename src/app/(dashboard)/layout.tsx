/**
 * Dashboard Layout
 * 
 * Wraps all authenticated pages with:
 *   - Desktop: Sidebar (left) + TopBar (top) + Content (main)
 *   - Mobile: TopBar (top) + Content (main) + BottomNav (bottom)
 */

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopBar />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="px-4 md:px-6 py-4 md:py-6 max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}
