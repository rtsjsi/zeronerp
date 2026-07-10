"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, Search, Filter, Box, History, ArrowRightLeft, Layers } from "lucide-react";
import { TabToolbar } from "@/components/shared/tab-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { ItemTable } from "@/components/inventory/item-table";
import { StockTable } from "@/components/inventory/stock-table";
import { CreateItemDialog } from "@/components/inventory/create-item-dialog";
import { EditItemDialog } from "@/components/inventory/edit-item-dialog";
import { WarehouseTable } from "@/components/inventory/warehouse-table";
import { CreateWarehouseDialog } from "@/components/inventory/create-warehouse-dialog";
import { EditWarehouseDialog } from "@/components/inventory/edit-warehouse-dialog";
import { TransactionTable } from "@/components/inventory/transaction-table";
import { StockMovementDialog } from "@/components/inventory/stock-movement-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

const TAB_LABELS: Record<string, string> = {
  items: "item master",
  stock: "stock",
  warehouses: "warehouses",
  history: "movements",
};

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("items");
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const [isEditWarehouseOpen, setIsEditWarehouseOpen] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<any | null>(null);
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/inventory/items");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: activeTab === "items",
  });

  const { data: stockItems, isLoading: isLoadingStock } = useQuery({
    queryKey: ["inventory-stock"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/inventory/stock");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: activeTab === "stock",
  });

  const { data: warehouses, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/inventory/warehouses");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: activeTab === "warehouses",
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["inventory-transactions"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/inventory/transactions");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: activeTab === "history",
  });

  const filteredItems = items?.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredStockItems = stockItems?.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.stocks?.some((stock: any) =>
      stock.warehouse?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  const filteredWarehouses = warehouses?.filter((wh: any) =>
    wh.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTransactions = transactions?.filter((tx: any) =>
    tx.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.reference?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await apiFetch(`/api/inventory/items/${id}`, { method: "DELETE" });
    if (res.success) {
      toast.success("Item deleted");
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
    }
  };

  const invalidateStockQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
  };

  return (
    <div className="animate-fade-in min-w-0">
      <Tabs value={activeTab} className="w-full min-w-0" onValueChange={setActiveTab}>
        <TabToolbar
          tabs={
            <TabsList variant="line" className="w-max min-w-full sm:min-w-0">
              <TabsTrigger value="items" className="gap-2 shrink-0">
                <Package className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Item Master</span>
                <span className="sm:hidden">Items</span>
              </TabsTrigger>
              <TabsTrigger value="stock" className="gap-2 shrink-0">
                <Layers className="w-4 h-4 shrink-0" /> Stock
              </TabsTrigger>
              <TabsTrigger value="warehouses" className="gap-2 shrink-0">
                <Box className="w-4 h-4 shrink-0" /> Warehouses
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 shrink-0">
                <History className="w-4 h-4 shrink-0" /> Movements
              </TabsTrigger>
            </TabsList>
          }
          actions={
            activeTab === "items" ? (
              <Button onClick={() => setIsItemOpen(true)} className="gap-2 shrink-0">
                <Plus className="w-4 h-4 shrink-0" /> Add Item
              </Button>
            ) : activeTab === "warehouses" ? (
              <Button onClick={() => setIsWarehouseOpen(true)} className="gap-2 shrink-0">
                <Plus className="w-4 h-4 shrink-0" /> Add Warehouse
              </Button>
            ) : activeTab === "stock" || activeTab === "history" ? (
              <Button variant="outline" onClick={() => setIsMovementOpen(true)} className="gap-2 shrink-0">
                <ArrowRightLeft className="w-4 h-4 shrink-0" /> Move Stock
              </Button>
            ) : null
          }
        >
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${TAB_LABELS[activeTab] ?? activeTab}...`}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
        </TabToolbar>

        <TabsContent value="items" className="mt-3">
          {isLoadingItems ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredItems && filteredItems.length > 0 ? (
            <ItemTable
              items={filteredItems}
              onEdit={(item) => {
                setEditItem(item);
                setIsEditItemOpen(true);
              }}
              onDelete={handleDeleteItem}
              onViewHistory={() => setActiveTab("history")}
            />
          ) : (
            <EmptyState
              icon={Package}
              title={searchQuery ? "No matching items" : "No items yet"}
              description={
                searchQuery
                  ? `No items found matching "${searchQuery}".`
                  : "Start by adding your first item to the master catalog."
              }
              actionLabel={searchQuery ? "Clear Search" : "Add Item"}
              onAction={() => (searchQuery ? setSearchQuery("") : setIsItemOpen(true))}
            />
          )}
        </TabsContent>

        <TabsContent value="stock" className="mt-3">
          {isLoadingStock ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredStockItems && filteredStockItems.length > 0 ? (
            <StockTable items={filteredStockItems} />
          ) : (
            <EmptyState
              icon={Layers}
              title={searchQuery ? "No matching stock" : "No stockable items yet"}
              description={
                searchQuery
                  ? `No stock records found matching "${searchQuery}".`
                  : "Add stockable items in Item Master, then receive stock via purchase invoices or manual adjustments."
              }
              actionLabel={searchQuery ? "Clear Search" : "Go to Item Master"}
              onAction={() => (searchQuery ? setSearchQuery("") : setActiveTab("items"))}
            />
          )}
        </TabsContent>

        <TabsContent value="warehouses" className="mt-3">
          {isLoadingWarehouses ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredWarehouses && filteredWarehouses.length > 0 ? (
            <WarehouseTable
              warehouses={filteredWarehouses}
              onEdit={(warehouse) => {
                setEditWarehouse(warehouse);
                setIsEditWarehouseOpen(true);
              }}
              onDelete={async (id) => {
                if (!confirm("Are you sure?")) return;
                const res = await apiFetch(`/api/inventory/warehouses/${id}`, { method: "DELETE" });
                if (res.success) {
                  toast.success("Warehouse deleted");
                  queryClient.invalidateQueries({ queryKey: ["warehouses"] });
                  queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
                }
              }}
            />
          ) : (
            <EmptyState
              icon={Box}
              title={searchQuery ? "No matching warehouses" : "No warehouses yet"}
              description={
                searchQuery
                  ? `No warehouses found matching "${searchQuery}".`
                  : "Add your storage locations to manage stock by warehouse."
              }
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          {isLoadingTransactions ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTransactions && filteredTransactions.length > 0 ? (
            <TransactionTable transactions={filteredTransactions} />
          ) : (
            <EmptyState
              icon={History}
              title={searchQuery ? "No matching movements" : "No movements recorded"}
              description={
                searchQuery
                  ? `No transactions found matching "${searchQuery}".`
                  : "Every stock adjustment or transfer will be logged here for audit."
              }
              actionLabel={searchQuery ? "Clear Search" : "Record Movement"}
              onAction={() => (searchQuery ? setSearchQuery("") : setIsMovementOpen(true))}
            />
          )}
        </TabsContent>
      </Tabs>

      <CreateItemDialog
        open={isItemOpen}
        onOpenChange={setIsItemOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
          queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
        }}
      />

      <EditItemDialog
        open={isEditItemOpen}
        onOpenChange={(open) => {
          setIsEditItemOpen(open);
          if (!open) setEditItem(null);
        }}
        item={editItem}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
          queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
        }}
      />

      <CreateWarehouseDialog
        open={isWarehouseOpen}
        onOpenChange={setIsWarehouseOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["warehouses"] })}
      />

      <EditWarehouseDialog
        open={isEditWarehouseOpen}
        onOpenChange={(open) => {
          setIsEditWarehouseOpen(open);
          if (!open) setEditWarehouse(null);
        }}
        warehouse={editWarehouse}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["warehouses"] })}
      />

      <StockMovementDialog
        open={isMovementOpen}
        onOpenChange={setIsMovementOpen}
        onSuccess={invalidateStockQueries}
      />
    </div>
  );
}
