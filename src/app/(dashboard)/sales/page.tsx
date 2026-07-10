"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt, UserCircle, Search, Filter, Users, Sparkles } from "lucide-react";
import { TabToolbar } from "@/components/shared/tab-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { CustomerTable } from "@/components/sales/customer-table";
import { CreateCustomerDialog } from "@/components/sales/create-customer-dialog";
import { EditCustomerDialog } from "@/components/sales/edit-customer-dialog";
import { SalesInvoiceTable } from "@/components/sales/sales-invoice-table";
import { CreateInvoiceDialog, type SalesInvoiceForEdit } from "@/components/sales/create-invoice-dialog";
import { ExpressPOSDialog } from "@/components/sales/express-pos-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoiceForEdit | null>(null);
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/sales/invoices");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: activeTab === "invoices",
  });

  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/sales/customers");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: activeTab === "customers",
  });

  // Filters
  const filteredInvoices = invoices?.filter((invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers?.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
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
                <span className="hidden sm:inline">Sales Invoices</span>
              </TabsTrigger>
              <TabsTrigger value="customers" className="gap-2 shrink-0">
                <Users className="w-4 h-4 shrink-0" /> Customers
              </TabsTrigger>
            </TabsList>
          }
          actions={
            activeTab === "invoices" ? (
              <>
                <Button variant="outline" onClick={() => { setEditingInvoice(null); setIsInvoiceOpen(true); }} className="gap-2 shrink-0">
                  <Receipt className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Record B2B Invoice</span>
                  <span className="sm:hidden">B2B Invoice</span>
                </Button>
                <Button
                  onClick={() => setIsPOSOpen(true)}
                  className="gap-2 shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md border-none"
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-yellow-300 fill-yellow-300" />
                  <span className="hidden sm:inline">Express POS</span>
                  <span className="sm:hidden">POS</span>
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsCustomerOpen(true)} className="gap-2 shrink-0">
                <UserCircle className="w-4 h-4 shrink-0" />
                <span>Add Customer</span>
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
            <SalesInvoiceTable
              invoices={filteredInvoices}
              onEdit={(invoice) => {
                setEditingInvoice(invoice);
                setIsInvoiceOpen(true);
              }}
            />
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

        <TabsContent value="customers" className="mt-3">
          {isLoadingCustomers ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCustomers && filteredCustomers.length > 0 ? (
            <CustomerTable
              customers={filteredCustomers}
              onEdit={(customer) => {
                setEditCustomer(customer);
                setIsEditCustomerOpen(true);
              }}
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

      <EditCustomerDialog
        open={isEditCustomerOpen}
        onOpenChange={(open) => {
          setIsEditCustomerOpen(open);
          if (!open) setEditCustomer(null);
        }}
        customer={editCustomer}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["customers"] })}
      />

      <CreateInvoiceDialog
        open={isInvoiceOpen}
        onOpenChange={(open) => {
          setIsInvoiceOpen(open);
          if (!open) setEditingInvoice(null);
        }}
        invoice={editingInvoice}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
        }}
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
