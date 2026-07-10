import { formatUom } from "@/lib/inventory/constants";
import { cn } from "@/lib/utils";

interface UomFieldProps {
  value?: string | null;
  className?: string;
}

/** Read-only UOM display aligned with item master labels (e.g. "Litre (l)"). */
export function UomField({ value, className }: UomFieldProps) {
  return (
    <div
      className={cn(
        "flex h-8 w-full min-w-0 items-center rounded-lg border border-input bg-muted/50 px-2.5 text-sm text-foreground",
        className,
      )}
    >
      {formatUom(value)}
    </div>
  );
}
