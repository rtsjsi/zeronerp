"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ShoppingCart, Search, Filter, ShoppingBag, Users, Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { VendorTable } from "@/components/procurement/vendor-table";
import { CreateVendorDialog } from "@/components/procurement/create-vendor-dialog";
import { PurchaseOrderTable } from "@/components/procurement/purchase-order-table";
import { CreatePurchaseOrderDialog } from "@/components/procurement/create-purchase-order-dialog";
import { PayableInvoiceTable } from "@/components/procurement/payable-invoice-table";
import { CreateInvoiceDialog } from "@/components/procurement/create-invoice-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Queries
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/procurement/orders");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/procurement/invoices");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  const { data: vendors, isLoading: isLoadingVendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/procurement/vendors");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  // Filters
  const filteredInvoices = invoices?.filter((invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders?.filter((order) =>
    order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVendors = vendors?.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Procurement"
        description="Manage suppliers, purchase orders, and payable invoices"
        breadcrumbs={[{ label: "Procurement" }]}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsVendorOpen(true)} className="gap-2">
            <Users className="w-4 h-4" /> Add Vendor
          </Button>
          <Button variant="outline" onClick={() => setIsOrderOpen(true)} className="gap-2">
            <ShoppingCart className="w-4 h-4" /> Create PO (Optional)
          </Button>
          <Button onClick={() => setIsInvoiceOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Record Supplier Invoice
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 p-4 rounded-xl border backdrop-blur-sm">
          <TabsList className="bg-background/50">
            <TabsTrigger value="invoices" className="gap-2">
              <Receipt className="w-4 h-4" /> Payable Invoices
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="w-4 h-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="vendors" className="gap-2">
              <Users className="w-4 h-4" /> Vendors
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="invoices" className="mt-6">
          {isLoadingInvoices ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredInvoices && filteredInvoices.length > 0 ? (
            <PayableInvoiceTable invoices={filteredInvoices} />
          ) : (
            <EmptyState
              icon={Receipt}
              title={searchQuery ? "No matching invoices" : "No invoices yet"}
              description={
                searchQuery
                  ? `No invoices found matching "${searchQuery}".`
                  : "Directly record supplier invoices with materials here to immediately update inventory stock."
              }
              actionLabel={searchQuery ? "Clear Search" : "Record Supplier Invoice"}
              onAction={() => (searchQuery ? setSearchQuery("") : setIsInvoiceOpen(true))}
            />
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          {isLoadingOrders ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <PurchaseOrderTable
              orders={filteredOrders}
              onViewDetails={() => {}}
              onUpdateStatus={(id, status) => {
                toast.promise(
                  apiFetch(`/api/procurement/orders/${id}`, { 
                    method: "PATCH", 
                    body: JSON.stringify({ status }) 
                  }),
                  {
                    loading: "Updating order...",
                    success: () => {
                      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
                      return "Order status updated";
                    },
                    error: "Failed to update order",
                  }
                );
              }}
            />
          ) : (
            <EmptyState
              icon={ShoppingCart}
              title={searchQuery ? "No matching orders" : "No purchase orders yet"}
              description={
                searchQuery
                  ? `No orders found matching "${searchQuery}".`
                  : "Create an optional purchase order to track supplier intent before invoicing."
              }
              actionLabel={searchQuery ? "Clear Search" : "Create Purchase Order"}
              onAction={() => (searchQuery ? setSearchQuery("") : setIsOrderOpen(true))}
            />
          )}
        </TabsContent>

        <TabsContent value="vendors" className="mt-6">
          {isLoadingVendors ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredVendors && filteredVendors.length > 0 ? (
            <VendorTable
              vendors={filteredVendors}
              onEdit={() => {}}
              onDelete={async (id) => {
                if (!confirm("Are you sure?")) return;
                const res = await apiFetch(`/api/procurement/vendors/${id}`, { method: "DELETE" });
                if (res.success) {
                  toast.success("Vendor deleted");
                  queryClient.invalidateQueries({ queryKey: ["vendors"] });
                }
              }}
            />
          ) : (
            <EmptyState
              icon={Users}
              title={searchQuery ? "No matching vendors" : "No vendors yet"}
              description={
                searchQuery
                  ? `No vendors found matching "${searchQuery}".`
                  : "Add your suppliers here to link them to purchase orders and invoices."
              }
              actionLabel={searchQuery ? "Clear Search" : "Add Vendor"}
              onAction={() => (searchQuery ? setSearchQuery("") : setIsVendorOpen(true))}
            />
          )}
        </TabsContent>
      </Tabs>

      <CreateVendorDialog
        open={isVendorOpen}
        onOpenChange={setIsVendorOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["vendors"] })}
      />

      <CreatePurchaseOrderDialog
        open={isOrderOpen}
        onOpenChange={setIsOrderOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })}
      />

      <CreateInvoiceDialog
        open={isInvoiceOpen}
        onOpenChange={setIsInvoiceOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
          queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        }}
        purchaseOrders={orders || []}
      />
    </div>
  );
}
