"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UserPlus, User, Mail, Shield } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";
import { CreateStoreUserDialog } from "./create-store-user-dialog";

interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export default function SuperAdminStoreDetailsPage() {
  const { id } = useParams() as { id: string };
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [id]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/super-admin/stores/${id}/users`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      } else {
        toast.error(json.message || "Failed to fetch users");
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
        title="Store Users" 
        description="Manage the users associated with this specific store."
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add User to Store
        </Button>
      </PageHeader>

      <Card className="flex-1 mt-6 flex flex-col min-h-0">
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">Loading users...</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No users found for this store.</TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <p>{user.fullName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" /> {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Shield className="w-3 h-3 text-muted-foreground" /> {user.role}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateStoreUserDialog 
        storeId={id}
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onSuccess={fetchUsers}
      />
    </div>
  );
}
