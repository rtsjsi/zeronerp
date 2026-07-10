"use client";

import { useMemo } from "react";
import { SearchableLovSelect } from "@/components/shared/searchable-lov-select";

export interface ItemOption {
  id: string;
  name: string;
  uom?: string | null;
}

interface ItemSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  items: readonly ItemOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  showUom?: boolean;
  className?: string;
  disabled?: boolean;
  id?: string;
}

function formatItemLabel(item: ItemOption, showUom: boolean) {
  if (showUom && item.uom) return `${item.name} (${item.uom})`;
  return item.name;
}

export function ItemSelect({
  value,
  onValueChange,
  items,
  placeholder = "Select item...",
  searchPlaceholder = "Search items...",
  showUom = true,
  className,
  disabled,
  id,
}: ItemSelectProps) {
  const options = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: formatItemLabel(item, showUom),
      })),
    [items, showUom],
  );

  return (
    <SearchableLovSelect
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage="No items found."
      className={className}
      disabled={disabled}
      aria-label={placeholder}
    />
  );
}
