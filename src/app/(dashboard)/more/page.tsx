/**
 * "More" page — mobile navigation overflow
 * 
 * Shows all modules that don't fit in the bottom nav's 5-item limit.
 */

"use client";

import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  Settings,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { label: "Finance", href: "/finance", icon: TrendingUp, description: "Accounts & GST" },
  { label: "Reports", href: "/reports", icon: BarChart3, description: "Business analytics" },
  { label: "Settings", href: "/settings", icon: Settings, description: "Configuration" },
];

export default function MorePage() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-foreground mb-4">More</h1>

      <div className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="p-2 rounded-lg bg-primary/5">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>

      <Separator className="my-4" />

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors"
      >
        <div className="p-2 rounded-lg bg-muted">
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </div>
        <span className="text-sm font-medium text-foreground">
          {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </span>
      </button>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors mt-1"
      >
        <div className="p-2 rounded-lg bg-destructive/10">
          <LogOut className="w-5 h-5 text-destructive" />
        </div>
        <span className="text-sm font-medium text-destructive">Sign Out</span>
      </button>

      {/* User card */}
      {user && (
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm font-medium text-foreground">{user.fullName}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{user.tenantName}</p>
        </div>
      )}
    </div>
  );
}
