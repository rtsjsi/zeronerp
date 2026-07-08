"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LovSelect } from "@/components/shared/lov-select";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

const ROLE_OPTIONS = [
  { value: "USER", label: "User (Standard)" },
  { value: "ADMIN", label: "Admin (Store Manager)" },
] as const;

interface CreateStoreUserDialogProps {
  storeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateStoreUserDialog({ storeId, open, onOpenChange, onSuccess }: CreateStoreUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    password: "",
    role: "USER",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const json = await apiFetch(`/api/super-admin/stores/${storeId}/users`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      
      if (json.success) {
        toast.success("User created successfully");
        setFormData({ username: "", fullName: "", password: "", role: "USER" });
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(json.message || "Failed to create user");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add User to Store</DialogTitle>
          <DialogDescription>
            Create a new user account linked to this store.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
            <Input 
              id="fullName" 
              required
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
            <Input 
              id="username" 
              required
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="john.doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <Input 
              id="password" 
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Leave blank for auto-generated"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <LovSelect
              value={formData.role}
              onValueChange={(val) => setFormData({ ...formData, role: val || "USER" })}
              options={ROLE_OPTIONS}
              placeholder="Select role"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.username || !formData.fullName}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
