import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Clock, FileText, Building2, Download } from "lucide-react";
import { useGetQuotation, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export function QuotationDetail() {
  const [, params] = useRoute("/quotations/:id");
  const quotationId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const isProcurementOfficer = user?.role === "procurement_officer" || user?.role === "admin";
  
  const { data: quotation, isLoading } = useGetQuotation(quotationId, {
    query: { enabled: !!quotationId }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-600/10 text-blue-600 border-blue-600/20';
      case 'under_review': return 'bg-amber-600/10 text-amber-600 border-amber-600/20';
      case 'accepted': return 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-1/3" />
        <Card><CardContent className="h-64 p-6"><Skeleton className="h-full w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!quotation) return <div>Quotation not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/quotations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Quotation #{quotation.id}</h1>
              <Badge variant="outline" className={`font-medium ${getStatusColor(quotation.status)}`}>
                {quotation.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" /> {quotation.vendorName}
              <span className="mx-1">•</span>
              <FileText className="h-3 w-3" /> RFQ #{quotation.rfqId}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          {isProcurementOfficer && quotation.status === 'submitted' && (
            <Link href={`/rfqs/${quotation.rfqId}/compare`}>
              <Button>Compare RFQ Responses</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Pricing Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden mb-6">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotation.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.rfqItemName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">₹{item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-medium">₹{item.totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg border">
              <span className="font-semibold text-lg">Total Amount</span>
              <span className="font-bold text-2xl">₹{quotation.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Delivery Timeline</h4>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {quotation.deliveryTimeline}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Submission Date</h4>
                <div className="text-foreground">
                  {format(new Date(quotation.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
              
              {quotation.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Vendor Notes</h4>
                  <div className="text-sm p-3 bg-muted/30 rounded-md border italic text-foreground/80">
                    "{quotation.notes}"
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
