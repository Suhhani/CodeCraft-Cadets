import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, Filter, ShoppingCart, Truck, Receipt } from "lucide-react";
import { useListPurchaseOrders, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export function PurchaseOrdersList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: pos, isLoading } = useListPurchaseOrders({});
  const { data: user } = useGetMe();
  
  const isProcurementOfficer = user?.role === "procurement_officer" || user?.role === "admin";
  const isVendor = user?.role === "vendor";

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground border-border';
      case 'sent': return 'bg-blue-600/10 text-blue-600 border-blue-600/20';
      case 'acknowledged': return 'bg-amber-600/10 text-amber-600 border-amber-600/20';
      case 'delivered': return 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20';
      case 'completed': return 'bg-indigo-600/10 text-indigo-600 border-indigo-600/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage orders, deliveries, and fulfillment</p>
        </div>
        {isProcurementOfficer && (
          <Link href="/purchase-orders/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create PO
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search POs..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto gap-2 bg-background">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>PO Number</TableHead>
              {!isVendor && <TableHead>Vendor</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  {!isVendor && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : pos?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isVendor ? 6 : 7} className="text-center py-8 text-muted-foreground">
                  No purchase orders found
                </TableCell>
              </TableRow>
            ) : (
              pos?.map((po) => (
                <TableRow key={po.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="font-medium text-foreground">{po.poNumber}</div>
                    {po.rfqId && <div className="text-xs text-muted-foreground mt-0.5">RFQ #{po.rfqId}</div>}
                  </TableCell>
                  {!isVendor && (
                    <TableCell>
                      <div className="font-medium">{po.vendorName}</div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="text-sm">{format(new Date(po.createdAt), "MMM d, yyyy")}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {po.deliveryDate ? format(new Date(po.deliveryDate), "MMM d, yyyy") : "-"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">₹{po.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-medium ${getStatusColor(po.status)}`}>
                      {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/purchase-orders/${po.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
