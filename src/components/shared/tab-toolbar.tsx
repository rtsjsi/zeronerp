/**
 * Responsive toolbar for tabbed pages — scrollable tabs on mobile with search/actions on the right.
 */

import { cn } from "@/lib/utils";

interface TabToolbarProps {
  tabs: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function TabToolbar({ tabs, children, className }: TabToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 bg-card/30 p-4 rounded-xl border backdrop-blur-sm min-w-0",
        className
      )}
    >
      <div className="w-full min-w-0 overflow-x-auto -mx-1 px-1 scrollbar-thin border-b border-border pb-1">
        {tabs}
      </div>
      <div className="flex items-center gap-2 w-full min-w-0">{children}</div>
    </div>
  );
}
