"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Store, Users, MapPin, Phone } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { CreateStoreDialog } from "./create-store-dialog";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  address?: string;
  contactNumber?: string;
  gstn?: string;
  createdAt: string;
}

export default function SuperAdminStoresPage() {
  const [stores, setStores] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/super-admin/stores");
      const json = await res.json();
      if (json.success) {
        setStores(json.data);
      } else {
        toast.error(json.message || "Failed to fetch stores");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col h-full overflow-hidden">
      <PageHeader 
        title="Manage Stores" 
        description="Super Admin view to manage all tenants across ZeronERP."
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Store
        </Button>
      </PageHeader>

      <Card className="flex-1 mt-6 flex flex-col min-h-0">
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>GSTN</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading stores...</TableCell>
                </TableRow>
              ) : stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No stores found.</TableCell>
                </TableRow>
              ) : (
                stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Store className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p>{store.name}</p>
                          <p className="text-xs text-muted-foreground">Slug: {store.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {store.contactNumber && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" /> {store.contactNumber}
                          </div>
                        )}
                        {store.address && (
                          <div className="flex items-center gap-1 text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" /> <span className="truncate max-w-[150px]">{store.address}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{store.gstn || "-"}</TableCell>
                    <TableCell>{format(new Date(store.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/super-admin/stores/${store.id}`}>
                        <Button variant="outline" size="sm">
                          <Users className="w-4 h-4 mr-2" />
                          Manage Users
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateStoreDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onSuccess={fetchStores}
      />
    </div>
  );
}
