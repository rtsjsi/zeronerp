"use client";

import { Users, MoreVertical, Shield, UserX, UserCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface User {
  id: string;
  username: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

export function UserTable({ users, onToggleStatus, onDelete }: UserTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground">{user.fullName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{user.username}</td>
                <td className="px-6 py-4">
                  <Badge variant={user.isActive ? "success" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <button className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors outline-none">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    } />
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onToggleStatus(user.id, user.isActive)}>
                        {user.isActive ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" /> Deactivate User
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" /> Activate User
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(user.id)}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
