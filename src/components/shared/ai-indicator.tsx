/**
 * AI Indicator — Badge shown next to any AI-generated content
 */

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiIndicatorProps {
  className?: string;
  label?: string;
}

export function AiIndicator({ className, label = "AI" }: AiIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
        "bg-violet-500/10 text-violet-600 dark:text-violet-400",
        "text-[10px] font-semibold uppercase tracking-wider",
        className,
      )}
    >
      <Sparkles className="w-3 h-3" />
      {label}
    </span>
  );
}
