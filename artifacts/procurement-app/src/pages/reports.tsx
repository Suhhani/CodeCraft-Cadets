import { useState } from "react";
import { Download, TrendingUp, Users, CheckCircle2, AlertTriangle } from "lucide-react";
import { useGetSpendingSummary, useGetMonthlyTrends, useGetVendorPerformance } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format } from "date-fns";

const INR = (val: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

const INR_SHORT = (val: number) => {
  if (val >= 10_00_000) return `₹${(val / 10_00_000).toFixed(1)}L`;
  if (val >= 1_00_000) return `₹${(val / 1_00_000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
};

const CATEGORY_COLORS = ["#4f86f7", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

export function ReportsPage() {
  const { data: spending, isLoading: loadingSpending } = useGetSpendingSummary();
  const { data: trends, isLoading: loadingTrends } = useGetMonthlyTrends();
  const { data: vendors, isLoading: loadingVendors } = useGetVendorPerformance();

  const currentMonth = format(new Date(), "MMMM yyyy");

  const kpis = [
    {
      label: "Total Spend",
      value: spending ? INR_SHORT(spending.totalSpend) : "—",
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: <TrendingUp className="h-5 w-5 text-blue-400" />,
      loading: loadingSpending,
    },
    {
      label: "Active Vendors",
      value: vendors ? String(vendors.filter((v) => v.totalOrders > 0).length) : "—",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      icon: <Users className="h-5 w-5 text-emerald-400" />,
      loading: loadingVendors,
    },
    {
      label: "PO Fulfillment",
      value: vendors
        ? `${Math.round(vendors.reduce((acc, v) => acc + v.onTimeDeliveryRate, 0) / Math.max(vendors.length, 1))}%`
        : "—",
      color: "text-amber-600",
      bg: "bg-amber-50",
      icon: <CheckCircle2 className="h-5 w-5 text-amber-400" />,
      loading: loadingVendors,
    },
    {
      label: "Overdue Invoices",
      value: "—",
      color: "text-red-600",
      bg: "bg-red-50",
      icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
      loading: false,
    },
  ];

  const categoryData = spending?.byCategory?.map((c) => ({
    category: c.category,
    amount: c.amount,
  })) ?? [];

  const trendData = (trends ?? []).map((t) => ({
    month: t.month,
    totalSpend: t.totalSpend,
  }));

  const topVendors = [...(vendors ?? [])]
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Procurement Insights — {currentMonth}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-sm">
            {currentMonth}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-sm">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border shadow-sm">
            <CardContent className="pt-5 pb-4">
              {kpi.loading ? (
                <Skeleton className="h-10 w-24 mb-1" />
              ) : (
                <div className={`text-3xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1 font-medium">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Spend by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSpending ? (
              <Skeleton className="h-56 w-full" />
            ) : categoryData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No data available</div>
            ) : (
              <div className="space-y-3">
                {categoryData.map((cat, i) => {
                  const max = Math.max(...categoryData.map((c) => c.amount));
                  const pct = Math.round((cat.amount / max) * 100);
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">{cat.category}</span>
                        <span className="text-muted-foreground font-medium">{INR_SHORT(cat.amount)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Top Vendors by Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVendors ? (
              <Skeleton className="h-56 w-full" />
            ) : topVendors.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No data available</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Vendor</TableHead>
                    <TableHead className="text-xs text-right">Spend (₹)</TableHead>
                    <TableHead className="text-xs text-right">POs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topVendors.map((v) => (
                    <TableRow key={v.vendorId}>
                      <TableCell className="font-medium text-sm py-2">{v.vendorName}</TableCell>
                      <TableCell className="text-right text-sm py-2 font-medium">
                        {v.totalSpend.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right text-sm py-2 text-muted-foreground">{v.totalOrders}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Monthly Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {loadingTrends ? (
            <Skeleton className="h-full w-full" />
          ) : trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(val) => INR_SHORT(val)}
                />
                <RechartsTooltip
                  formatter={(value: number) => [INR(value), "Spend"]}
                  contentStyle={{ fontSize: 13, borderRadius: 8 }}
                />
                <Bar dataKey="totalSpend" radius={[4, 4, 0, 0]}>
                  {trendData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === trendData.length - 1 ? "#1d4ed8" : "#93c5fd"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
