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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {user?.name || "User"} — Today's Overview
          </p>
        </div>
        <div className="flex gap-2">
          {isProcurementOfficer && (
            <>
              <Link href="/rfqs/new">
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> New RFQ
                </Button>
              </Link>
              <Link href="/vendors/new">
                <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                  <Users className="h-3.5 w-3.5" /> Add Vendor
                </Button>
              </Link>
              <Link href="/purchase-orders/new">
                <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                  <ShoppingCart className="h-3.5 w-3.5" /> New PO
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Open RFQs"
          value={summary?.activeRfqs}
          icon={FileText}
          isLoading={isLoading}
          href="/rfqs"
          color="green"
        />
        <MetricCard
          title="Pending Approvals"
          value={summary?.pendingApprovals}
          icon={CheckSquare}
          isLoading={isLoading}
          href="/approvals"
          color="amber"
        />
        <MetricCard
          title="Total Spend"
          value={summary?.totalSpend}
          icon={TrendingUp}
          isLoading={isLoading}
          href="/reports"
          color="blue"
          formatter={formatCurrency}
        />
        <MetricCard
          title="Active Vendors"
          value={summary?.vendorCount}
          icon={Users}
          isLoading={isLoading}
          href="/vendors"
          color="purple"
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <Link href="/activity-logs">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5">
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
              <div className="space-y-4">
                {summary.recentActivity.slice(0, 7).map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-0.5 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">
                        <span className="font-medium">{activity.userName}</span>
                        {" — "}
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No recent activity found.</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            {isProcurementOfficer ? (
              <>
                <QuickActionLink href="/vendors/new" icon={Users} label="Register New Vendor" />
                <QuickActionLink href="/rfqs/new" icon={FileText} label="Create RFQ" />
                <QuickActionLink href="/purchase-orders/new" icon={ShoppingCart} label="Draft Purchase Order" />
                <QuickActionLink
                  href="/approvals"
                  icon={CheckSquare}
                  label="Review Approvals"
                  badge={summary?.pendingApprovals}
                />
                <QuickActionLink href="/reports" icon={TrendingUp} label="View Reports" />
              </>
            ) : (
              <>
                <QuickActionLink href="/rfqs" icon={FileText} label="View Open RFQs" />
                <QuickActionLink href="/quotations/new" icon={MessageSquare} label="Submit Quotation" />
                <QuickActionLink href="/invoices" icon={Receipt} label="Manage Invoices" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Purchase Orders", value: summary?.recentPurchaseOrders ?? 0, href: "/purchase-orders", icon: ShoppingCart },
          { label: "Invoices", value: summary?.recentInvoices ?? 0, href: "/invoices", icon: Receipt },
          { label: "Quotations", value: 0, href: "/quotations", icon: MessageSquare },
          { label: "Vendors", value: summary?.vendorCount ?? 0, href: "/vendors", icon: Users },
        ].map(({ label, value, href, icon: Icon }) => (
          <Link key={label} href={href} className="block">
            <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{value}</p>
              )}
            </div>
          </Link>
        ))}
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
  color = "green",
  formatter,
}: {
  title: string;
  value?: number;
  icon: React.ElementType;
  isLoading: boolean;
  href: string;
  color?: "green" | "amber" | "blue" | "purple";
  formatter?: (v: number) => string;
}) {
  const colorMap = {
    green: "bg-green-50 text-green-600 border-green-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };
  const display = formatter ? formatter(value ?? 0) : String(value ?? 0);
  return (
    <Link href={href} className="block">
      <Card className="hover:border-primary/40 transition-colors cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{title}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold tracking-tight text-foreground">{display}</p>
              )}
            </div>
            <div className={`p-2.5 rounded-lg border ${colorMap[color]}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
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
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-border/60 bg-card hover:bg-muted/60 hover:border-border transition-colors group text-sm"
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      <span className="font-medium text-foreground flex-1">{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1.5 min-w-4 flex items-center justify-center">
          {badge}
        </Badge>
      )}
    </Link>
  );
}
