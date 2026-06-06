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
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

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
  const { data: user, isLoading: isLoadingUser } = useGetMe();

  const navItems: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Vendors", href: "/vendors", icon: Users },
    { title: "RFQs", href: "/rfqs", icon: FileText },
    { title: "Quotations", href: "/quotations", icon: MessageSquare },
    { title: "Approvals", href: "/approvals", icon: CheckSquare },
    { title: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
    { title: "Invoices", href: "/invoices", icon: Receipt },
    { title: "Activity Logs", href: "/activity-logs", icon: Activity },
    { title: "Reports", href: "/reports", icon: BarChart3 },
  ];

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-muted/20">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex-shrink-0 flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity">
            <div className="bg-primary-foreground text-primary p-1.5 rounded-md">
              <img src={`${basePath}/logo.svg`} alt="Logo" className="w-5 h-5 stroke-current" />
            </div>
            Procuris
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden ml-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-sidebar-border/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start px-2 py-6 hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground">
                <Avatar className="h-8 w-8 mr-3 border border-sidebar-border">
                  <AvatarImage src={clerkUser?.imageUrl} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {clerkUser?.firstName?.charAt(0) || user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start overflow-hidden mr-auto">
                  <span className="text-sm font-medium truncate w-full">{clerkUser?.fullName || user?.name || "Loading..."}</span>
                  <span className="text-xs text-sidebar-foreground/60 truncate w-full capitalize">
                    {user?.role ? user.role.replace('_', ' ') : "User"}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground flex flex-col gap-1">
                <span className="truncate">{user?.email}</span>
                {user?.companyName && (
                  <span className="truncate font-medium text-foreground">{user.companyName}</span>
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-card shadow-sm z-10 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border border-card" />
            </Button>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
