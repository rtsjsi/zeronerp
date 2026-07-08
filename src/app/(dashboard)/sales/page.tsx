"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Receipt, UserCircle, Search, Filter, ShoppingCart, Users, ShoppingBag, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TabToolbar } from "@/components/shared/tab-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { CustomerTable } from "@/components/sales/customer-table";
import { CreateCustomerDialog } from "@/components/sales/create-customer-dialog";
import { SalesOrderTable } from "@/components/sales/sales-order-table";
import { CreateSalesOrderDialog } from "@/components/sales/create-sales-order-dialog";
import { SalesInvoiceTable } from "@/components/sales/sales-invoice-table";
import { CreateInvoiceDialog } from "@/components/sales/create-invoice-dialog";
import { ExpressPOSDialog } from "@/components/sales/express-pos-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Queries
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["sales-orders"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/sales/orders");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/sales/invoices");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/sales/customers");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  // Filters
  const filteredInvoices = invoices?.filter((invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders?.filter((order) =>
    order.soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers?.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in min-w-0">
      <PageHeader
        title="Sales"
        description="Manage customers, sales orders, and invoices"
        breadcrumbs={[{ label: "Sales" }]}
      >
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full">
          <Button variant="outline" onClick={() => setIsCustomerOpen(true)} className="gap-2 w-full sm:w-auto">
            <UserCircle className="w-4 h-4 shrink-0" />
            <span>Add Customer</span>
          </Button>
          <Button variant="outline" onClick={() => setIsOrderOpen(true)} className="gap-2 w-full sm:w-auto">
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Create SO</span>
            <span className="hidden sm:inline">Create SO (Optional)</span>
          </Button>
          <Button variant="outline" onClick={() => setIsInvoiceOpen(true)} className="gap-2 w-full sm:w-auto">
            <Receipt className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">B2B Invoice</span>
            <span className="hidden sm:inline">Record B2B Invoice</span>
          </Button>
          <Button
            onClick={() => setIsPOSOpen(true)}
            className="gap-2 w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md border-none"
          >
            <Sparkles className="w-4 h-4 shrink-0 text-yellow-300 fill-yellow-300" />
            <span className="sm:hidden">Express POS</span>
            <span className="hidden sm:inline">Express POS checkout</span>
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} className="w-full min-w-0" onValueChange={setActiveTab}>
        <TabToolbar
          tabs={
            <TabsList className="bg-background/50 w-max min-w-full sm:min-w-0">
              <TabsTrigger value="invoices" className="gap-2 shrink-0">
                <Receipt className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">Invoices</span>
                <span className="hidden sm:inline">Sales Invoices</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2 shrink-0">
                <ShoppingBag className="w-4 h-4 shrink-0" /> Orders
              </TabsTrigger>
              <TabsTrigger value="customers" className="gap-2 shrink-0">
                <Users className="w-4 h-4 shrink-0" /> Customers
              </TabsTrigger>
            </TabsList>
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

        <TabsContent value="invoices" className="mt-6">
          {isLoadingInvoices ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredInvoices && filteredInvoices.length > 0 ? (
            <SalesInvoiceTable invoices={filteredInvoices} />
          ) : (
            <EmptyState
              icon={Receipt}
              title={searchQuery ? "No matching invoices" : "No invoices yet"}
              description={
                searchQuery
                  ? `No invoices found matching "${searchQuery}".`
                  : "Directly record sales invoices or checkout walk-in retail buyers here to instantly generate receipts."
              }
              actionLabel={searchQuery ? "Clear Search" : "Record Sales Invoice"}
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
            <SalesOrderTable
              orders={filteredOrders}
              onUpdateStatus={(id, status) => {
                toast.promise(
                  apiFetch(`/api/sales/orders/${id}`, { 
                    method: "PATCH", 
                    body: JSON.stringify({ status }) 
                  }),
                  {
                    loading: "Updating order...",
                    success: () => {
                      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
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
              title={searchQuery ? "No matching orders" : "No sales orders yet"}
              description={
                searchQuery
                  ? `No orders found matching "${searchQuery}".`
                  : "Create an optional sales order to track customer intent before invoicing."
              }
              actionLabel={searchQuery ? "Clear Search" : "Create Sales Order"}
              onAction={() => (searchQuery ? setSearchQuery("") : setIsOrderOpen(true))}
            />
          )}
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          {isLoadingCustomers ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCustomers && filteredCustomers.length > 0 ? (
            <CustomerTable
              customers={filteredCustomers}
              onDelete={async (id) => {
                if (!confirm("Are you sure?")) return;
                const res = await apiFetch(`/api/sales/customers/${id}`, { method: "DELETE" });
                if (res.success) {
                  toast.success("Customer deleted");
                  queryClient.invalidateQueries({ queryKey: ["customers"] });
                }
              }}
            />
          ) : (
            <EmptyState
              icon={Users}
              title={searchQuery ? "No matching customers" : "No customers yet"}
              description={
                searchQuery
                  ? `No customers found matching "${searchQuery}".`
                  : "Add your customers here to link them to sales orders and invoices."
              }
              actionLabel={searchQuery ? "Clear Search" : "Add Customer"}
              onAction={() => (searchQuery ? setSearchQuery("") : setIsCustomerOpen(true))}
            />
          )}
        </TabsContent>
      </Tabs>

      <CreateCustomerDialog
        open={isCustomerOpen}
        onOpenChange={setIsCustomerOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["customers"] })}
      />

      <CreateSalesOrderDialog
        open={isOrderOpen}
        onOpenChange={setIsOrderOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["sales-orders"] })}
      />

      <CreateInvoiceDialog
        open={isInvoiceOpen}
        onOpenChange={setIsInvoiceOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
          queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
        }}
        salesOrders={orders || []}
      />

      <ExpressPOSDialog
        open={isPOSOpen}
        onOpenChange={setIsPOSOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
        }}
      />
    </div>
  );
}
