"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Users, Receipt } from "lucide-react";
import { TabToolbar } from "@/components/shared/tab-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { VendorTable } from "@/components/procurement/vendor-table";
import { CreateVendorDialog } from "@/components/procurement/create-vendor-dialog";
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
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/procurement/invoices");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: activeTab === "invoices",
  });

  const { data: vendors, isLoading: isLoadingVendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/procurement/vendors");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: activeTab === "vendors",
  });

  // Filters
  const filteredInvoices = invoices?.filter((invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVendors = vendors?.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in min-w-0">
      <Tabs value={activeTab} className="w-full min-w-0" onValueChange={setActiveTab}>
        <TabToolbar
          tabs={
            <TabsList variant="line" className="w-max min-w-full sm:min-w-0">
              <TabsTrigger value="invoices" className="gap-2 shrink-0">
                <Receipt className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">Invoices</span>
                <span className="hidden sm:inline">Payable Invoices</span>
              </TabsTrigger>
              <TabsTrigger value="vendors" className="gap-2 shrink-0">
                <Users className="w-4 h-4 shrink-0" /> Vendors
              </TabsTrigger>
            </TabsList>
          }
          actions={
            activeTab === "invoices" ? (
              <Button onClick={() => setIsInvoiceOpen(true)} className="gap-2 shrink-0">
                <Plus className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Record Supplier Invoice</span>
                <span className="sm:hidden">Record Invoice</span>
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsVendorOpen(true)} className="gap-2 shrink-0">
                <Users className="w-4 h-4 shrink-0" />
                <span>Add Vendor</span>
              </Button>
            )
          }
        >
          <div className="relative flex-1 min-w-0">
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
        </TabToolbar>

        <TabsContent value="invoices" className="mt-3">
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

        <TabsContent value="vendors" className="mt-3">
          {isLoadingVendors ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredVendors && filteredVendors.length > 0 ? (
            <VendorTable
              vendors={filteredVendors}
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

      <CreateInvoiceDialog
        open={isInvoiceOpen}
        onOpenChange={setIsInvoiceOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
        }}
      />
    </div>
  );
}
