import { useGetDashboardSummary, useGetMe } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  MessageSquare,
  CheckSquare,
  ShoppingCart,
  Receipt,
  Plus,
  ArrowRight,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

export function DashboardPage() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: user } = useGetMe();
  const isProcurementOfficer = user?.role === "procurement_officer" || user?.role === "admin";

  const formatCurrency = (amount?: number) => {
    if (!amount) return "₹0";
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
    return `₹${amount}`;
  };

  const today = new Date();
  const greeting =
    today.getHours() < 12 ? "Good morning" :
    today.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting}, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(today, "EEEE, MMMM d, yyyy")} · Procurement Overview
          </p>
        </div>
        {isProcurementOfficer && (
          <div className="flex flex-wrap gap-2">
            <Link href="/rfqs/new">
              <Button size="sm" className="gap-1.5 shadow-sm">
                <Plus className="h-3.5 w-3.5" /> New RFQ
              </Button>
            </Link>
            <Link href="/vendors/new">
              <Button variant="outline" size="sm" className="gap-1.5 bg-white">
                <Users className="h-3.5 w-3.5" /> Add Vendor
              </Button>
            </Link>
            <Link href="/purchase-orders/new">
              <Button variant="outline" size="sm" className="gap-1.5 bg-white">
                <ShoppingCart className="h-3.5 w-3.5" /> New PO
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* KPI metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Open RFQs"
          value={summary?.activeRfqs}
          icon={FileText}
          isLoading={isLoading}
          href="/rfqs"
          accent="blue"
          formatter={(v) => String(v)}
        />
        <MetricCard
          title="Pending Approvals"
          value={summary?.pendingApprovals}
          icon={CheckSquare}
          isLoading={isLoading}
          href="/approvals"
          accent="amber"
          formatter={(v) => String(v)}
        />
        <MetricCard
          title="Total Spend"
          value={summary?.totalSpend}
          icon={TrendingUp}
          isLoading={isLoading}
          href="/reports"
          accent="green"
          formatter={formatCurrency}
        />
        <MetricCard
          title="Active Vendors"
          value={summary?.vendorCount}
          icon={Users}
          isLoading={isLoading}
          href="/vendors"
          accent="purple"
          formatter={(v) => String(v)}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <Card className="lg:col-span-2 shadow-sm border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-[15px] font-semibold">Recent Activity</CardTitle>
            </div>
            <Link href="/activity-logs">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : summary?.recentActivity && summary.recentActivity.length > 0 ? (
              <div className="divide-y divide-border/40">
                {summary.recentActivity.slice(0, 7).map((activity, idx) => (
                  <div key={activity.id} className={`flex gap-3 ${idx === 0 ? "pb-3.5" : "py-3.5"}`}>
                    <div className="mt-0.5 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground leading-snug">
                        <span className="font-semibold">{activity.userName}</span>
                        <span className="text-muted-foreground"> — </span>
                        {activity.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm border-border/70">
          <CardHeader className="pb-3 pt-5 px-5 border-b border-border/50">
            <CardTitle className="text-[15px] font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-5 pt-4 space-y-1.5">
            {isProcurementOfficer ? (
              <>
                <QuickActionLink href="/vendors/new"       icon={Users}       label="Register New Vendor" />
                <QuickActionLink href="/rfqs/new"          icon={FileText}    label="Create RFQ" />
                <QuickActionLink href="/purchase-orders/new" icon={ShoppingCart} label="Draft Purchase Order" />
                <QuickActionLink
                  href="/approvals"
                  icon={CheckSquare}
                  label="Review Approvals"
                  badge={summary?.pendingApprovals}
                />
                <QuickActionLink href="/reports"           icon={TrendingUp}  label="View Reports" />
              </>
            ) : (
              <>
                <QuickActionLink href="/rfqs"              icon={FileText}    label="View Open RFQs" />
                <QuickActionLink href="/quotations/new"    icon={MessageSquare} label="Submit Quotation" />
                <QuickActionLink href="/invoices"          icon={Receipt}     label="Manage Invoices" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats mini-cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 tracking-wide uppercase text-[11px]">
          Module Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Purchase Orders", value: summary?.recentPurchaseOrders ?? 0, href: "/purchase-orders", icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
            { label: "Invoices",        value: summary?.recentInvoices ?? 0,        href: "/invoices",        icon: Receipt,      color: "text-green-600 bg-green-50" },
            { label: "Quotations",      value: 0,                                   href: "/quotations",      icon: MessageSquare, color: "text-purple-600 bg-purple-50" },
            { label: "Vendors",         value: summary?.vendorCount ?? 0,           href: "/vendors",         icon: Users,        color: "text-amber-600 bg-amber-50" },
          ].map(({ label, value, href, icon: Icon, color }) => (
            <Link key={label} href={href} className="block group">
              <div className="bg-white border border-border/70 rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                )}
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  isLoading,
  href,
  accent = "blue",
  formatter,
}: {
  title: string;
  value?: number;
  icon: React.ElementType;
  isLoading: boolean;
  href: string;
  accent?: "blue" | "amber" | "green" | "purple";
  formatter?: (v: number) => string;
}) {
  const accentConfig = {
    blue:   { bar: "card-accent-blue",   icon: "bg-blue-50 text-blue-600",   trend: "text-blue-600" },
    amber:  { bar: "card-accent-amber",  icon: "bg-amber-50 text-amber-600", trend: "text-amber-600" },
    green:  { bar: "card-accent-green",  icon: "bg-green-50 text-green-600", trend: "text-green-600" },
    purple: { bar: "card-accent-purple", icon: "bg-purple-50 text-purple-600", trend: "text-purple-600" },
  };
  const cfg = accentConfig[accent];
  const display = formatter ? formatter(value ?? 0) : String(value ?? 0);

  return (
    <Link href={href} className="block group">
      <div className={`bg-white border border-border/70 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 ${cfg.bar}`}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
            <div className={`p-2 rounded-lg ${cfg.icon}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <p className="text-3xl font-bold tracking-tight text-foreground">{display}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function QuickActionLink({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border/60 bg-white hover:bg-primary/5 hover:border-primary/30 transition-all group text-sm"
    >
      <div className="p-1.5 rounded-md bg-muted group-hover:bg-primary/10 transition-colors flex-shrink-0">
        <Icon className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="font-medium text-foreground flex-1 text-[13px]">{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1.5 min-w-4 flex items-center justify-center">
          {badge}
        </Badge>
      )}
      <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
