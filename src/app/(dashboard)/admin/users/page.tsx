"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Users, Search, Filter } from "lucide-react";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { UserTable } from "@/components/admin/user-table";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export default function UserManagementPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/admin/users");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  const filteredUsers = users?.filter((user: any) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    toast.promise(
      apiFetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentStatus }),
      }),
      {
        loading: "Updating status...",
        success: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          return "User status updated";
        },
        error: "Failed to update status",
      }
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will remove the user's access to the application.")) return;
    
    toast.promise(
      apiFetch(`/api/admin/users/${id}`, { method: "DELETE" }),
      {
        loading: "Deleting user...",
        success: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          return "User deleted successfully";
        },
        error: "Failed to delete user",
      }
    );
  };

  return (
    <div className="animate-fade-in min-w-0">
      <PageToolbar
        actions={
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
            <UserPlus className="w-4 h-4" /> Add Member
          </Button>
        }
      >
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <Filter className="w-4 h-4" />
        </Button>
      </PageToolbar>

      <div className="mt-3">
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <UserTable 
            users={filteredUsers} 
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />
        ) : (
          <EmptyState
            icon={Users}
            title={searchQuery ? "No members found" : "No members yet"}
            description={
              searchQuery
                ? `No members match your search "${searchQuery}".`
                : "Add your first team member to start collaborating."
            }
            actionLabel={searchQuery ? "Clear Search" : "Add Member"}
            onAction={() => (searchQuery ? setSearchQuery("") : setIsCreateOpen(true))}
          />
        )}
      </div>

      <CreateUserDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
      />
    </div>
  );
}
