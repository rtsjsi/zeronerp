/**
 * Sidebar Component — Desktop navigation
 * 
 * Fixed left sidebar on desktop/tablet-landscape.
 * Collapses to icon-only on medium screens.
 * Hidden on mobile (replaced by BottomNav).
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Factory,
  Users as UsersIcon,
  Search,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Procurement", href: "/procurement", icon: ShoppingCart },
  { label: "Sales", href: "/sales", icon: Receipt },
  { label: "Finance", href: "/finance", icon: TrendingUp },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

const secondaryNavItems: NavItem[] = [
  { label: "Production", href: "/production", icon: Factory },
  { label: "HR", href: "/hr", icon: UsersIcon },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const isActive = (href: string) => pathname.startsWith(href);

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground/70",
          collapsed && "justify-center px-2",
        )}
      >
        <Icon className={cn("w-[18px] h-[18px] shrink-0", active && "drop-shadow-sm")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badge && (
          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive text-white">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger render={linkContent} />
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{linkContent}</div>;
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border",
        "transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-[68px]" : "w-[260px]",
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-2.5 px-4 h-16 shrink-0", collapsed && "justify-center px-2")}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M14 14L26 8" stroke="white" strokeWidth="2" />
            <path d="M14 14L2 8" stroke="white" strokeWidth="2" />
            <path d="M14 14V26" stroke="white" strokeWidth="2" />
          </svg>
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">ZeronERP</span>
        )}
      </div>

      {/* Search (collapsed = icon only) */}
      {!collapsed ? (
        <div className="px-3 mb-2">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-sidebar-accent/50 text-sidebar-foreground/50 text-sm hover:bg-sidebar-accent transition-colors">
            <Search className="w-4 h-4" />
            <span>Search…</span>
            <kbd className="ml-auto text-[10px] font-mono bg-sidebar-accent px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
        </div>
      ) : (
        <div className="px-2 mb-2">
          <Tooltip>
            <TooltipTrigger
              className="w-full flex justify-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/50"
            >
              <Search className="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent side="right">Search (⌘K)</TooltipContent>
          </Tooltip>
        </div>
      )}

      <Separator className="mx-3 mb-2" />

      {/* Main Navigation */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        <div className="space-y-0.5">
          {!collapsed && (
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 mb-1 block">
              Main
            </span>
          )}
          {mainNavItems.map(renderNavItem)}
        </div>

        <div className="pt-4 space-y-0.5">
          {!collapsed && (
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 mb-1 block">
              Operations
            </span>
          )}
          {secondaryNavItems.map(renderNavItem)}
        </div>
      </nav>

      <Separator className="mx-3 mt-2" />

      {/* Bottom section */}
      <div className="px-2 py-3 space-y-1">
        {/* AI Assistant */}
        {renderNavItem({ label: "Settings", href: "/settings", icon: Settings })}

        {/* Theme toggle */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full",
                "text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors",
                "justify-center px-2",
              )}
            >
              {theme === "dark" ? (
                <Sun className="w-[18px] h-[18px]" />
              ) : (
                <Moon className="w-[18px] h-[18px]" />
              )}
            </TooltipTrigger>
            <TooltipContent side="right">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors",
            )}
          >
            {theme === "dark" ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        )}

        <Separator className="!my-2" />

        {/* User */}
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg",
            collapsed && "justify-center px-2",
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
            {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.fullName || "User"}
              </p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate">
                {user?.tenantName || "Organization"}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="text-sidebar-foreground/40 hover:text-destructive transition-colors p-1"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-20 -right-3 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border shadow-sm flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:shadow-md transition-all z-50"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
