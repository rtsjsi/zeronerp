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
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Factory,
  Users as UsersIcon,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Production", href: "/production", icon: FlaskConical },
  { label: "Purchase", href: "/procurement", icon: ShoppingCart },
  { label: "Sales", href: "/sales", icon: Receipt },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

const adminNavItems: NavItem[] = [
  { label: "User Management", href: "/admin/users", icon: UsersIcon },
];

const superAdminNavItems: NavItem[] = [
  { label: "Stores", href: "/super-admin/stores", icon: Factory }, // Using Factory or another icon
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

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
      {/* Logo + store */}
      <div className={cn("px-4 py-4 shrink-0", collapsed && "px-2")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger className="flex justify-center w-full">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                  <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M14 14L26 8" stroke="white" strokeWidth="2" />
                  <path d="M14 14L2 8" stroke="white" strokeWidth="2" />
                  <path d="M14 14V26" stroke="white" strokeWidth="2" />
                </svg>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <p className="font-medium">ZeronERP</p>
              {user?.tenantName && (
                <p className="text-xs text-muted-foreground">{user.tenantName}</p>
              )}
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                  <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M14 14L26 8" stroke="white" strokeWidth="2" />
                  <path d="M14 14L2 8" stroke="white" strokeWidth="2" />
                  <path d="M14 14V26" stroke="white" strokeWidth="2" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-sidebar-foreground">ZeronERP</span>
            </div>
            {user?.tenantName && (
              <p className="mt-1.5 pl-[42px] text-xs font-medium text-sidebar-foreground/60 truncate">
                {user.tenantName}
              </p>
            )}
          </div>
        )}
      </div>

      <Separator className="mx-3 mb-2" />

      {/* Main Navigation */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {user?.storeId && (
          <>
            <div className="space-y-0.5">
              {!collapsed && (
                <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 mb-1 block">
                  Main
                </span>
              )}
              {mainNavItems.map(renderNavItem)}
            </div>

            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <div className="pt-4 space-y-0.5">
                {!collapsed && (
                  <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 mb-1 block">
                    Admin
                  </span>
                )}
                {adminNavItems.map(renderNavItem)}
              </div>
            )}
          </>
        )}

        {user?.role === 'SUPER_ADMIN' && (
          <div className="pt-4 space-y-0.5">
            {!collapsed && (
              <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 mb-1 block">
                Super Admin
              </span>
            )}
            {superAdminNavItems.map(renderNavItem)}
          </div>
        )}
      </nav>

      <Separator className="mx-3 mt-2" />

      {/* Bottom section */}
      <div className="px-2 py-3 space-y-1">
        {/* Placeholder if needed */}
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
