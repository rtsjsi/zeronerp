"use client";

import type { ReactNode } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface LovOption {
  value: string;
  label: string;
}

interface LovSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly LovOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  prefix?: ReactNode;
}

export function LovSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className,
  disabled,
  prefix,
}: LovSelectProps) {
  const selected = options.find((option) => option.value === value);

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        if (val != null) onValueChange(val);
      }}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full", className)}>
        {prefix}
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
