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
  Building2,
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
import { Badge } from "@/components/ui/badge";
import { useGetMe } from "@workspace/api-client-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  group: string;
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard",       href: "/dashboard",       icon: LayoutDashboard, group: "main" },
  { title: "Vendors",         href: "/vendors",         icon: Users,           group: "procurement" },
  { title: "RFQs",            href: "/rfqs",            icon: FileText,        group: "procurement" },
  { title: "Quotations",      href: "/quotations",      icon: MessageSquare,   group: "procurement" },
  { title: "Approvals",       href: "/approvals",       icon: CheckSquare,     group: "procurement" },
  { title: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart,    group: "procurement" },
  { title: "Invoices",        href: "/invoices",        icon: Receipt,         group: "procurement" },
  { title: "Reports",         href: "/reports",         icon: BarChart3,       group: "analytics" },
  { title: "Activity",        href: "/activity-logs",   icon: Activity,        group: "analytics" },
];

const NAV_GROUPS = [
  { key: "main",        label: null },
  { key: "procurement", label: "Procurement" },
  { key: "analytics",   label: "Analytics" },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: user } = useGetMe();

  const checkActive = (href: string) =>
    location === href || location.startsWith(`${href}/`);

  const currentPage = NAV_ITEMS.find((n) => checkActive(n.href));

  const roleLabel = user?.role
    ? user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "User";

  const initials =
    clerkUser?.firstName?.charAt(0).toUpperCase() ||
    user?.name?.charAt(0).toUpperCase() ||
    "U";

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Dark navy sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col sidebar-gradient border-r border-[hsl(222_47%_17%)] transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand / Logo */}
        <div className="h-14 flex items-center px-4 border-b border-[hsl(222_47%_17%)] flex-shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg flex-shrink-0">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col leading-none gap-0.5">
              <span className="text-[13px] font-bold text-white tracking-tight">Procuris</span>
              <span className="text-[10px] text-slate-500 font-medium">Enterprise</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-auto h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
          {NAV_GROUPS.map(({ key, label }) => {
            const items = NAV_ITEMS.filter((i) => i.group === key);
            return (
              <div key={key}>
                {label && (
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600 px-3 mb-2">
                    {label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = checkActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2.5 pl-2.5 pr-3 py-[7px] rounded-lg text-[13px] font-medium transition-all group
                          ${active
                            ? "sidebar-item-active text-white"
                            : "sidebar-item-inactive text-slate-400 hover:text-slate-100"
                          }`}
                      >
                        <Icon
                          className={`h-[15px] w-[15px] flex-shrink-0 transition-colors ${
                            active
                              ? "text-blue-400"
                              : "text-slate-500 group-hover:text-slate-300"
                          }`}
                        />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 pt-3 border-t border-[hsl(222_47%_17%)] flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] transition-colors group text-left">
                <Avatar className="h-7 w-7 flex-shrink-0 ring-2 ring-blue-600/40">
                  <AvatarImage src={clerkUser?.imageUrl} />
                  <AvatarFallback className="bg-blue-700 text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[12px] font-semibold text-slate-200 truncate leading-tight">
                    {clerkUser?.fullName || user?.name || "Loading…"}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate capitalize">{roleLabel}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-600 flex-shrink-0 group-hover:text-slate-400 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-52 mb-1">
              <DropdownMenuLabel className="text-xs">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 space-y-0.5">
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                {user?.companyName && (
                  <p className="text-xs font-semibold truncate">{user.companyName}</p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer text-xs"
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-border shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground h-8 w-8"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {currentPage && (
              <div className="hidden md:flex items-center gap-2">
                <currentPage.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{currentPage.title}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user?.role && (
              <Badge
                variant="outline"
                className="hidden sm:flex text-[10px] font-semibold capitalize border-blue-200 text-blue-700 bg-blue-50 px-2 py-0.5"
              >
                {roleLabel}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground h-8 w-8"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 border border-white" />
            </Button>
            <Avatar className="h-7 w-7 ring-1 ring-border cursor-pointer">
              <AvatarImage src={clerkUser?.imageUrl} />
              <AvatarFallback className="bg-blue-700 text-white text-[10px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
