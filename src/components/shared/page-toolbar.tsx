/**
 * Compact toolbar for non-tabbed pages — search/filter on the left, actions on the right.
 */

import { cn } from "@/lib/utils";

interface PageToolbarProps {
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageToolbar({ children, actions, className }: PageToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-card/30 p-3 rounded-xl border backdrop-blur-sm min-w-0 w-full",
        !children && actions && "justify-end",
        className
      )}
    >
      {children}
      {actions && (
        <div className={cn("flex items-center gap-2 shrink-0", children && "ml-auto")}>
          {actions}
        </div>
      )}
    </div>
  );
}
