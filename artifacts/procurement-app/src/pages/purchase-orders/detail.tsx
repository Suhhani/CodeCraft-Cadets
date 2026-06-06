import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Printer, FileText, ShoppingCart, Truck, MapPin, Download, Send } from "lucide-react";
import { useGetPurchaseOrder, useUpdatePurchaseOrder, useGetMe, getGetPurchaseOrderQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PurchaseOrderDetail() {
  const [, params] = useRoute("/purchase-orders/:id");
  const poId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  
  const isProcurementOfficer = user?.role === "procurement_officer" || user?.role === "admin";
  const isVendor = user?.role === "vendor";

  const { data: po, isLoading } = useGetPurchaseOrder(poId, {
    query: { enabled: !!poId }
  });

  const updatePurchaseOrder = useUpdatePurchaseOrder();

  const handleStatusUpdate = (newStatus: any) => {
    updatePurchaseOrder.mutate(
      { id: poId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPurchaseOrderQueryKey(poId) });
          toast({ title: "Status Updated", description: `Purchase Order marked as ${newStatus}.` });
        }
      }
    );
  };

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

  const printDocument = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-1/3" />
        <Card><CardContent className="h-64 p-6"><Skeleton className="h-full w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!po) return <div>Purchase Order not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:m-0 print:max-w-none print:w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/purchase-orders")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Purchase Order</h1>
              <Badge variant="outline" className={`font-medium ${getStatusColor(po.status)}`}>
                {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm font-mono mt-1">{po.poNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printDocument} className="gap-2">
            <Printer className="h-4 w-4" /> Print PDF
          </Button>
          
          {isProcurementOfficer && po.status === 'draft' && (
            <Button onClick={() => handleStatusUpdate('sent')} className="gap-2">
              <Send className="h-4 w-4" /> Send to Vendor
            </Button>
          )}

          {isVendor && po.status === 'sent' && (
            <Button onClick={() => handleStatusUpdate('acknowledged')} className="gap-2">
              Acknowledge Receipt
            </Button>
          )}

          {isProcurementOfficer && po.status === 'acknowledged' && (
            <Button onClick={() => handleStatusUpdate('delivered')} className="gap-2">
              <Truck className="h-4 w-4" /> Mark Delivered
            </Button>
          )}

          {isProcurementOfficer && po.status === 'delivered' && (
            <Link href={`/invoices/new?purchaseOrderId=${po.id}`}>
              <Button className="gap-2">
                <FileText className="h-4 w-4" /> Generate Invoice
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm p-8 print:border-none print:shadow-none print:p-0">
        <div className="flex justify-between items-start border-b pb-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground mb-4">
              <div className="bg-primary p-1.5 rounded-md print:bg-transparent print:p-0">
                <ShoppingCart className="w-5 h-5 text-primary-foreground print:text-black" />
              </div>
              Procuris Enterprise
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>100 Enterprise Way</p>
              <p>San Francisco, CA 94105</p>
              <p>procurement@procuris.com</p>
            </div>
          </div>
          <div className="text-right space-y-2">
            <h2 className="text-2xl font-bold uppercase text-foreground">Purchase Order</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">PO Number:</span>
              <span className="font-mono font-medium">{po.poNumber}</span>
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{format(new Date(po.createdAt), "MMM d, yyyy")}</span>
              {po.deliveryDate && (
                <>
                  <span className="text-muted-foreground">Delivery Due:</span>
                  <span className="font-medium">{format(new Date(po.deliveryDate), "MMM d, yyyy")}</span>
                </>
              )}
              {po.rfqId && (
                <>
                  <span className="text-muted-foreground">Reference RFQ:</span>
                  <span className="font-medium">#{po.rfqId}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="py-8 border-b grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3 tracking-wider">Vendor (To)</h3>
            <div className="font-medium text-lg text-foreground">{po.vendorName}</div>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              {/* If we had full vendor object we'd show address here */}
              <p>Vendor ID: #{po.vendorId}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3 tracking-wider">Ship To</h3>
            <div className="font-medium text-foreground">Procuris HQ - Receiving</div>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              <p>100 Enterprise Way, Loading Dock B</p>
              <p>San Francisco, CA 94105</p>
            </div>
          </div>
        </div>

        <div className="py-8">
          <Table className="print:text-sm">
            <TableHeader className="bg-muted/50 print:bg-gray-100">
              <TableRow>
                <TableHead className="w-[50px] text-center">#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right w-24">Qty</TableHead>
                <TableHead className="w-24">Unit</TableHead>
                <TableHead className="text-right w-32">Unit Price</TableHead>
                <TableHead className="text-right w-32">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                  <TableCell className="text-right">${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-medium">${item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-8">
            <div className="w-full sm:w-1/2 lg:w-1/3 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${po.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({po.taxRate}%)</span>
                <span className="font-medium">${po.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-3 mt-3">
                <span className="font-bold text-base">Total Amount</span>
                <span className="font-bold text-xl">${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-xs text-muted-foreground text-center border-t pt-8 print:mt-8">
          This purchase order is subject to Procuris standard terms and conditions.
        </div>
      </div>
    </div>
  );
}
