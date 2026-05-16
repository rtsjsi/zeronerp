"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Users, Shield, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { UserTable } from "@/components/admin/user-table";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export default function UserManagementPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
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
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="User Management"
        description="Manage your organization's members and their access."
        breadcrumbs={[{ label: "Admin" }, { label: "Users" }]}
      >
        <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Invite Member
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 p-4 rounded-xl border backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>Showing {filteredUsers?.length || 0} members</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:max-w-xs">
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
        </div>
      </div>

      <div className="mt-6">
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
                : "Invite your first team member to collaborate on ZeronERP."
            }
            actionLabel={searchQuery ? "Clear Search" : "Invite Member"}
            onAction={() => (searchQuery ? setSearchQuery("") : setIsInviteOpen(true))}
          />
        )}
      </div>

      <InviteUserDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
      />
    </div>
  );
}
