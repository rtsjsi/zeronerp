"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface Tenant {
  id: string;
  name: string;
}

export function StoreSelector() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Tenant[]>([]);
  const [selectedId, setSelectedId] = useState<string>('none');

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') return;

    const match = document.cookie.match(new RegExp('(^| )zeron_superadmin_store_id=([^;]+)'));
    if (match) setSelectedId(match[2]);

    const loadStores = async () => {
      const json = await apiFetch<Tenant[]>('/api/super-admin/stores');
      if (json.success && json.data) setStores(json.data);
    };

    loadStores();
  }, [user]);

  if (user?.role !== 'SUPER_ADMIN') return null;

  const handleSelect = (val: string | null) => {
    if (!val) return;
    setSelectedId(val);
    if (val === 'none') {
      document.cookie = "zeron_superadmin_store_id=; path=/; max-age=0";
    } else {
      document.cookie = `zeron_superadmin_store_id=${val}; path=/; max-age=86400`;
    }
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedId} onValueChange={handleSelect}>
        <SelectTrigger className="w-[180px] h-9">
          <Store className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Select Store" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Super Admin View</SelectItem>
          {stores.map(store => (
            <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
