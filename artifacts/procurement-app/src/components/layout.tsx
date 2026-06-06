import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  CheckSquare,
  ShoppingCart,
  Receipt,
  Activity,
  BarChart3,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetMe } from "@workspace/api-client-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: user } = useGetMe();

  const navItems: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Vendors", href: "/vendors", icon: Users },
    { title: "RFQs", href: "/rfqs", icon: FileText },
    { title: "Quotations", href: "/quotations", icon: MessageSquare },
    { title: "Approvals", href: "/approvals", icon: CheckSquare },
    { title: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
    { title: "Invoices", href: "/invoices", icon: Receipt },
    { title: "Reports", href: "/reports", icon: BarChart3 },
    { title: "Activity", href: "/activity-logs", icon: Activity },
  ];

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-muted/40">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-sidebar-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-bold text-base tracking-tight hover:opacity-90 transition-opacity"
          >
            <div className="bg-primary text-primary-foreground w-7 h-7 rounded-md flex items-center justify-center text-xs font-extrabold">
              VB
            </div>
            <span className="text-sidebar-foreground">VendorBridge</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-auto h-7 w-7 text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              location === item.href ||
              location.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-foreground/60 hover:bg-muted hover:text-sidebar-foreground"
                }`}
              >
                <Icon
                  className={`h-4 w-4 flex-shrink-0 ${
                    isActive ? "text-sidebar-primary" : ""
                  }`}
                />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start px-2 py-2 h-auto hover:bg-muted text-sidebar-foreground"
              >
                <Avatar className="h-7 w-7 mr-2.5 border border-border">
                  <AvatarImage src={clerkUser?.imageUrl} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {clerkUser?.firstName?.charAt(0) || user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start overflow-hidden mr-auto">
                  <span className="text-xs font-semibold truncate w-full">
                    {clerkUser?.fullName || user?.name || "Loading..."}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate w-full capitalize">
                    {user?.role ? user.role.replace("_", " ") : "User"}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 opacity-40 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground flex flex-col gap-1">
                <span className="truncate">{user?.email}</span>
                {user?.companyName && (
                  <span className="truncate font-medium text-foreground">
                    {user.companyName}
                  </span>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-card shadow-sm z-10 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:block text-sm font-medium text-muted-foreground">
            Procurement Management System
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground h-8 w-8"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-destructive border border-card" />
            </Button>
            <div className="text-xs text-muted-foreground hidden sm:block">
              {user?.name || clerkUser?.fullName || ""}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
