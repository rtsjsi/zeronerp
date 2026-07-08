"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Package,
  ShoppingCart,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Users,
  Box,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await apiFetch<any>("/api/dashboard/stats");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  const kpiCards = [
    {
      title: "Total Inventory Value",
      value: formatCurrency(stats?.inventoryValue || 0),
      change: "+0.0%",
      trend: "up" as const,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "This Month Sales",
      value: formatCurrency(stats?.monthSales || 0),
      change: "+0.0%",
      trend: "up" as const,
      icon: Receipt,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      change: "0",
      trend: "up" as const,
      icon: ShoppingCart,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Active Partners",
      value: (stats?.vendorCount || 0) + (stats?.customerCount || 0),
      change: `V:${stats?.vendorCount || 0} C:${stats?.customerCount || 0}`,
      trend: "up" as const,
      icon: Users,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Welcome back
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your ZeronERP instance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={i}
              className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? "..." : kpi.value}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">{kpi.change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Record Sales Invoice", href: "/sales", icon: Receipt },
              { label: "Add Inventory Item", href: "/inventory", icon: Box },
              { label: "Record Supplier Invoice", href: "/procurement", icon: ShoppingBagIcon },
            ].map((action, i) => {
              const ActionIcon = action.icon || Package;
              return (
                <Link
                  key={i}
                  href={action.href}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                    <ActionIcon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                  <Plus className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <TrendingUp className="w-8 h-8 mb-4 opacity-20" />
              <p className="text-sm">Real-time activity feed coming soon.</p>
              <p className="text-xs mt-1">Audit logs are already being captured in the background.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShoppingBagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
