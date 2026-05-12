/**
 * Dashboard Home Page
 * 
 * Shows role-based KPI widgets, recent activity, and quick actions.
 * This is a placeholder that will be expanded in Phase 2.
 */

import {
  Package,
  ShoppingCart,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Dashboard",
};

const kpiCards = [
  {
    title: "Total Inventory Value",
    value: "₹24,56,890",
    change: "+12.5%",
    trend: "up" as const,
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "This Month Sales",
    value: "₹8,45,200",
    change: "+8.2%",
    trend: "up" as const,
    icon: Receipt,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Pending Orders",
    value: "23",
    change: "-3.1%",
    trend: "down" as const,
    icon: ShoppingCart,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "Revenue Growth",
    value: "+18.5%",
    change: "+2.4%",
    trend: "up" as const,
    icon: TrendingUp,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Good afternoon 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your business today.
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
                <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.trend === "up" ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      kpi.trend === "up" ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {kpi.change}
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
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
              { label: "New Sales Invoice", href: "/sales/invoices/new", icon: Receipt },
              { label: "Add Stock Entry", href: "/inventory/stock/new", icon: Package },
              { label: "Create Purchase Order", href: "/procurement/orders/new", icon: ShoppingCart },
            ].map((action, i) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                    <ActionIcon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                No activity yet
              </h3>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                Start by creating your first inventory item or sales order. Your recent activity will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
