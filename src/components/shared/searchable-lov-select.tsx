"use client";

import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LovOption } from "@/components/shared/lov-select";

interface SearchableLovSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly LovOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}

export function SearchableLovSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  disabled,
  id,
  "aria-label": ariaLabel,
}: SearchableLovSelectProps) {
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <Combobox.Root
      items={[...options]}
      value={selected}
      onValueChange={(option) => onValueChange(option?.value ?? "")}
      isItemEqualToValue={(a, b) => a.value === b.value}
      disabled={disabled}
    >
      <Combobox.Trigger
        id={id}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          className,
        )}
      >
        <Combobox.Value placeholder={placeholder}>
          {(selectedValue: LovOption | null) => (
            <span
              className={cn("truncate", !selectedValue && "text-muted-foreground")}
            >
              {selectedValue?.label ?? placeholder}
            </span>
          )}
        </Combobox.Value>
        <Combobox.Icon className="text-muted-foreground">
          <ChevronDownIcon className="size-4" />
        </Combobox.Icon>
      </Combobox.Trigger>

      <Combobox.Portal>
        <Combobox.Positioner align="start" sideOffset={4} className="isolate z-50">
          <Combobox.Popup
            aria-label={ariaLabel ?? placeholder}
            className="z-50 max-h-[min(20rem,var(--available-height))] w-(--anchor-width) min-w-48 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <div className="border-b border-border p-2">
              <Combobox.Input
                placeholder={searchPlaceholder}
                className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <Combobox.Empty className="px-3 py-4 text-sm text-muted-foreground">
              {emptyMessage}
            </Combobox.Empty>

            <Combobox.List className="max-h-60 overflow-y-auto p-1">
              {(option: LovOption) => (
                <Combobox.Item
                  key={option.value}
                  value={option}
                  className="relative flex w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <span className="truncate">{option.label}</span>
                  <Combobox.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
