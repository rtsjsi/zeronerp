/**
 * Top Bar — Global header with search, notifications, and user menu
 */

"use client";

import { useState } from "react";
import { Search, Bell, Sparkles, Menu, Sun, Moon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export function TopBar() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left — Mobile menu + page context */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger (for sheet drawer if needed) */}
          <Sheet>
            <SheetTrigger className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="p-4">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
                      <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                      <path d="M14 14L26 8" stroke="white" strokeWidth="2" />
                      <path d="M14 14L2 8" stroke="white" strokeWidth="2" />
                      <path d="M14 14V26" stroke="white" strokeWidth="2" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold">ZeronERP</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use the bottom navigation to switch between modules.
                </p>
              </div>
            </SheetContent>
          </Sheet>

          {/* Breadcrumb area — will be populated per page */}
          <div className="hidden md:block" id="breadcrumb-portal" />
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition-colors" id="user-menu-btn">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            } />
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user?.fullName || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
