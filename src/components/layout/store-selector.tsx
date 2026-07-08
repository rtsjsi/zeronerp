"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { LovSelect } from "@/components/shared/lov-select";
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

    // Important: wait until `stores` are loaded before setting `selectedId`.
    // Otherwise, the Select control may not find a matching SelectItem yet and fall back to showing the raw `id`.
    const match = document.cookie.match(
      new RegExp('(^| )zeron_superadmin_store_id=([^;]+)'),
    );
    const cookieStoreId = match?.[2];

    const loadStores = async () => {
      const json = await apiFetch<Tenant[]>('/api/super-admin/stores');
      if (json.success && json.data) {
        setStores(json.data);

        if (cookieStoreId && json.data.some(s => String(s.id) === cookieStoreId)) {
          setSelectedId(cookieStoreId);
        } else {
          setSelectedId('none');
        }
      } else {
        setSelectedId('none');
      }
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

  const storeOptions = [
    { value: "none", label: "Super Admin View" },
    ...stores.map((store) => ({ value: String(store.id), label: store.name })),
  ];

  return (
    <div className="flex items-center gap-2 min-w-0 max-w-full">
      <LovSelect
        value={selectedId}
        onValueChange={handleSelect}
        options={storeOptions}
        placeholder="Select Store"
        className="max-w-[180px] min-w-0 h-9"
        prefix={<Store className="w-4 h-4 mr-2 shrink-0" />}
      />
    </div>
  );
}
