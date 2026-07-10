import { formatUom, normalizeUomCode } from "@/lib/inventory/constants";
import { cn } from "@/lib/utils";

interface UomFieldProps {
  value?: string | null;
  className?: string;
  /** Show 3-char code only — for narrow columns in line-item grids. */
  compact?: boolean;
}

/** Read-only UOM display aligned with item master labels (e.g. "Litre (LTR)"). */
export function UomField({ value, className, compact }: UomFieldProps) {
  const display = compact
    ? value
      ? normalizeUomCode(value)
      : "—"
    : formatUom(value);

  return (
    <div
      className={cn(
        "flex h-8 w-full min-w-0 items-center rounded-lg border border-input bg-muted/50 text-foreground",
        compact ? "justify-center px-1.5 text-sm font-medium" : "px-2.5 text-sm",
        className,
      )}
    >
      {display}
    </div>
  );
}
