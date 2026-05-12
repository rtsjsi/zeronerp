"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ItemTable } from "@/components/inventory/item-table";
import { CreateItemDialog } from "@/components/inventory/create-item-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export default function InventoryPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/inventory/items");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  const filteredItems = items?.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const res = await apiFetch(`/api/inventory/items/${id}`, { method: "DELETE" });
      if (res.success) {
        toast.success("Item deleted");
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      } else {
        toast.error("Failed to delete item");
      }
    } catch (err) {
      toast.error("Error deleting item");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Inventory"
        description="Manage items, warehouses, and stock levels"
        breadcrumbs={[{ label: "Inventory" }]}
      >
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 p-4 rounded-xl border backdrop-blur-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search SKU or name..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
          <div className="text-xs text-muted-foreground hidden sm:block">
            Showing {filteredItems?.length || 0} items
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredItems && filteredItems.length > 0 ? (
        <ItemTable
          items={filteredItems}
          onEdit={(item) => console.log("Edit", item)}
          onDelete={handleDelete}
          onViewHistory={(item) => console.log("History", item)}
        />
      ) : (
        <EmptyState
          icon={Package}
          title={searchQuery ? "No matching items" : "No items yet"}
          description={
            searchQuery
              ? `No items found matching "${searchQuery}". Try a different search term.`
              : "Start by adding your first inventory item. You can also scan documents to auto-fill item details."
          }
          actionLabel={searchQuery ? "Clear Search" : "Add Item"}
          onAction={() => (searchQuery ? setSearchQuery("") : setIsCreateOpen(true))}
        />
      )}

      <CreateItemDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["inventory-items"] })}
      />
    </div>
  );
}
