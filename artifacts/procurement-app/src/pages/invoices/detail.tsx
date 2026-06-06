import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Printer, Receipt, Mail, Download, CreditCard, Building2 } from "lucide-react";
import { useGetInvoice, useUpdateInvoice, useSendInvoiceEmail, useGetMe, getGetInvoiceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export function InvoiceDetail() {
  const [, params] = useRoute("/invoices/:id");
  const invoiceId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  
  const isProcurementOfficer = user?.role === "procurement_officer" || user?.role === "admin";
  const isVendor = user?.role === "vendor";

  const { data: invoice, isLoading } = useGetInvoice(invoiceId, {
    query: { enabled: !!invoiceId }
  });

  const updateInvoice = useUpdateInvoice();
  const sendEmail = useSendInvoiceEmail();

  const handleStatusUpdate = (newStatus: any) => {
    const data: any = { status: newStatus };
    if (newStatus === 'paid') {
      data.paidAt = new Date().toISOString();
    }
    
    updateInvoice.mutate(
      { id: invoiceId, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(invoiceId) });
          toast({ title: "Status Updated", description: `Invoice marked as ${newStatus}.` });
        }
      }
    );
  };

  const handleSendEmail = () => {
    sendEmail.mutate(
      { id: invoiceId },
      {
        onSuccess: () => {
          toast({ title: "Email Sent", description: "Invoice has been sent to the vendor." });
          if (invoice?.status === 'draft') {
            queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(invoiceId) });
          }
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground border-border';
      case 'sent': return 'bg-blue-600/10 text-blue-600 border-blue-600/20';
      case 'paid': return 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20';
      case 'overdue': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'cancelled': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-1/3" />
        <Card><CardContent className="h-64 p-6"><Skeleton className="h-full w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:m-0 print:max-w-none print:w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/invoices")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoice</h1>
              <Badge variant="outline" className={`font-medium ${getStatusColor(invoice.status)}`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm font-mono mt-1">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Print PDF
          </Button>
          
          {isProcurementOfficer && invoice.status === 'draft' && (
            <Button onClick={handleSendEmail} disabled={sendEmail.isPending} className="gap-2">
              <Mail className="h-4 w-4" /> Send Email
            </Button>
          )}

          {isProcurementOfficer && (invoice.status === 'sent' || invoice.status === 'overdue') && (
            <Button onClick={() => handleStatusUpdate('paid')} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <CreditCard className="h-4 w-4" /> Mark as Paid
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm p-8 print:border-none print:shadow-none print:p-0">
        <div className="flex justify-between items-start border-b pb-8">
          <div>
            <h2 className="text-2xl font-bold uppercase text-foreground mb-4">INVOICE</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">Invoice #:</span>
              <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{format(new Date(invoice.createdAt), "MMM d, yyyy")}</span>
              <span className="text-muted-foreground text-destructive font-medium">Due Date:</span>
              <span className="font-medium text-destructive">{format(new Date(invoice.dueDate), "MMM d, yyyy")}</span>
              <span className="text-muted-foreground mt-2">PO Reference:</span>
              <span className="font-medium mt-2">
                <Link href={`/purchase-orders/${invoice.purchaseOrderId}`} className="text-primary hover:underline">
                  {invoice.poNumber}
                </Link>
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 font-bold text-xl tracking-tight text-foreground mb-4">
              Procuris Enterprise
              <div className="bg-primary p-1.5 rounded-md print:bg-transparent print:p-0">
                <Receipt className="w-5 h-5 text-primary-foreground print:text-black" />
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>100 Enterprise Way</p>
              <p>San Francisco, CA 94105</p>
              <p>billing@procuris.com</p>
            </div>
          </div>
        </div>

        <div className="py-8 border-b grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3 tracking-wider">Bill To</h3>
            <div className="font-medium text-lg text-foreground">Procuris Enterprise</div>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              <p>Accounts Payable</p>
              <p>100 Enterprise Way</p>
              <p>San Francisco, CA 94105</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3 tracking-wider">Pay To (Vendor)</h3>
            <div className="font-medium text-lg text-foreground">{invoice.vendorName}</div>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              <p>Vendor ID: #{invoice.vendorId}</p>
              <p className="mt-3 font-medium text-foreground">Remittance details on file.</p>
            </div>
          </div>
        </div>

        <div className="py-8">
          <Table className="print:text-sm">
            <TableHeader className="bg-muted/50 print:bg-gray-100">
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right w-24">Qty</TableHead>
                <TableHead className="text-right w-32">Unit Price</TableHead>
                <TableHead className="text-right w-32">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
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
                <span className="font-medium">${invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                <span className="font-medium">${invoice.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-3 mt-3">
                <span className="font-bold text-base">Total Due</span>
                <span className="font-bold text-2xl text-foreground">${invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              {invoice.status === 'paid' && invoice.paidAt && (
                <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-md mt-4">
                  <span className="font-medium">Paid On</span>
                  <span className="font-medium">{format(new Date(invoice.paidAt), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
