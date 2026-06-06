import { useGetDashboardSummary, useGetMe } from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  MessageSquare, 
  CheckSquare, 
  ShoppingCart, 
  Receipt,
  Plus,
  ArrowRight,
  Activity,
  Users
} from "lucide-react";
import { format } from "date-fns";

export function DashboardPage() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: user, isLoading: isLoadingUser } = useGetMe();

  const isProcurementOfficer = user?.role === "procurement_officer" || user?.role === "admin";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name || 'User'}. Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-2">
          {isProcurementOfficer && (
            <>
              <Link href="/rfqs/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> New RFQ
                </Button>
              </Link>
              <Link href="/purchase-orders/new">
                <Button variant="outline" className="gap-2">
                  <ShoppingCart className="h-4 w-4" /> New PO
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Pending Approvals" 
          value={summary?.pendingApprovals} 
          icon={CheckSquare} 
          isLoading={isLoadingSummary} 
          href="/approvals"
        />
        <MetricCard 
          title="Active RFQs" 
          value={summary?.activeRfqs} 
          icon={FileText} 
          isLoading={isLoadingSummary} 
          href="/rfqs"
        />
        <MetricCard 
          title="Recent Purchase Orders" 
          value={summary?.recentPurchaseOrders} 
          icon={ShoppingCart} 
          isLoading={isLoadingSummary} 
          href="/purchase-orders"
        />
        <MetricCard 
          title="Recent Invoices" 
          value={summary?.recentInvoices} 
          icon={Receipt} 
          isLoading={isLoadingSummary} 
          href="/invoices"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest actions across the platform</CardDescription>
            </div>
            <Link href="/activity-logs">
              <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-4 items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : summary?.recentActivity && summary.recentActivity.length > 0 ? (
              <div className="space-y-6 pt-4">
                {summary.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-tight text-foreground">
                        <span className="font-medium">{activity.userName}</span>{" "}
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No recent activity found.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Frequently used tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isProcurementOfficer ? (
              <>
                <QuickActionLink href="/vendors/new" icon={Users} label="Register New Vendor" />
                <QuickActionLink href="/rfqs/new" icon={FileText} label="Create Request for Quotation" />
                <QuickActionLink href="/purchase-orders/new" icon={ShoppingCart} label="Draft Purchase Order" />
                <QuickActionLink href="/approvals" icon={CheckSquare} label="Review Pending Approvals" badge={summary?.pendingApprovals} />
              </>
            ) : (
              <>
                <QuickActionLink href="/rfqs" icon={FileText} label="View Open RFQs" />
                <QuickActionLink href="/quotations" icon={MessageSquare} label="Submit Quotations" />
                <QuickActionLink href="/invoices" icon={Receipt} label="Manage Invoices" />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  isLoading,
  href
}: { 
  title: string; 
  value?: number; 
  icon: React.ElementType; 
  isLoading: boolean;
  href: string;
}) {
  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors group">
      <Link href={href} className="block">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold tracking-tight text-foreground">{value || 0}</p>
              )}
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

function QuickActionLink({ 
  href, 
  icon: Icon, 
  label, 
  badge 
}: { 
  href: string; 
  icon: React.ElementType; 
  label: string; 
  badge?: number 
}) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-border transition-colors group"
    >
      <div className="text-muted-foreground group-hover:text-primary transition-colors">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium flex-1">{label}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}
