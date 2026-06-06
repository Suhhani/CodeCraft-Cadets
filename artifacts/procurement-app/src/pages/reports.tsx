import { useGetSpendingSummary, useGetMonthlyTrends, useGetVendorPerformance } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function ReportsPage() {
  const { data: spending, isLoading: loadingSpending } = useGetSpendingSummary();
  const { data: trends, isLoading: loadingTrends } = useGetMonthlyTrends();
  const { data: vendors, isLoading: loadingVendors } = useGetVendorPerformance();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics & Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Key procurement metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Total Spending</CardTitle>
            <CardDescription>Overall procurement expenditure</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSpending ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="text-4xl font-bold text-foreground">
                ${spending?.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingSpending ? (
              <Skeleton className="h-full w-full" />
            ) : spending?.byCategory && spending.byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spending.byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {spending.byCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingTrends ? (
              <Skeleton className="h-full w-full" />
            ) : trends && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `$${val/1000}k`} />
                  <RechartsTooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Line type="monotone" dataKey="totalSpend" name="Spend" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vendor Performance</CardTitle>
          <CardDescription>Key metrics by supplier</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Spend</TableHead>
                <TableHead className="text-right">Avg Delivery (Days)</TableHead>
                <TableHead className="text-right">On-time Rate</TableHead>
                <TableHead className="text-right">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingVendors ? (
                <TableRow><TableCell colSpan={6}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
              ) : vendors?.map((v) => (
                <TableRow key={v.vendorId}>
                  <TableCell className="font-medium">{v.vendorName}</TableCell>
                  <TableCell className="text-right">{v.totalOrders}</TableCell>
                  <TableCell className="text-right font-medium">${v.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell className="text-right">{v.avgDeliveryDays ? v.avgDeliveryDays.toFixed(1) : '-'}</TableCell>
                  <TableCell className="text-right">{v.onTimeDeliveryRate.toFixed(0)}%</TableCell>
                  <TableCell className="text-right">
                    {v.rating ? (
                      <span className="text-amber-500 font-medium">★ {v.rating.toFixed(1)}</span>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
