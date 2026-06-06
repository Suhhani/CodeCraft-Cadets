import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { FileText, ArrowLeft, Clock, Building2, User, FileCheck, CheckCircle2 } from "lucide-react";
import { useGetRfq, useListQuotations, useUpdateRfq, getGetRfqQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export function RfqDetail() {
  const [, params] = useRoute("/rfqs/:id");
  const rfqId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: rfq, isLoading: isRfqLoading } = useGetRfq(rfqId, {
    query: { enabled: !!rfqId }
  });
  
  const { data: quotations, isLoading: isQuotationsLoading } = useListQuotations(
    { rfqId },
    { query: { enabled: !!rfqId } }
  );

  const updateRfq = useUpdateRfq();

  const handleCloseRfq = () => {
    updateRfq.mutate(
      { id: rfqId, data: { status: 'closed' } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRfqQueryKey(rfqId) });
          toast({
            title: "RFQ Closed",
            description: "Vendors can no longer submit quotations.",
          });
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20';
      case 'closed': return 'bg-amber-600/10 text-amber-600 border-amber-600/20';
      case 'awarded': return 'bg-blue-600/10 text-blue-600 border-blue-600/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (isRfqLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-1/3" />
        <Card><CardContent className="h-64 p-6"><Skeleton className="h-full w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!rfq) return <div>RFQ not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/rfqs")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{rfq.title}</h1>
              <Badge variant="outline" className={`font-medium ${getStatusColor(rfq.status)}`}>
                {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1).replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm font-mono mt-1">{rfq.rfqNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {rfq.status === 'open' && (
            <Button variant="outline" onClick={handleCloseRfq} disabled={updateRfq.isPending}>
              Close Bidding
            </Button>
          )}
          {rfq.status === 'closed' && (
            <Link href={`/rfqs/${rfqId}/compare`}>
              <Button className="gap-2">
                <FileCheck className="h-4 w-4" /> Compare Quotations
              </Button>
            </Link>
          )}
          {rfq.status === 'awarded' && (
            <Badge className="h-10 px-4 bg-blue-600/10 text-blue-600 border-blue-600/20 font-semibold rounded-md text-sm gap-2">
              <CheckCircle2 className="h-4 w-4" /> Awarded
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {rfq.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                <p className="text-sm leading-relaxed text-foreground">{rfq.description}</p>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Line Items ({rfq.items.length})</h4>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfq.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{item.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity} <span className="text-muted-foreground text-xs ml-1">{item.unit}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created Date</span>
                <span className="text-sm font-medium">{format(new Date(rfq.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deadline</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-destructive" />
                  {format(new Date(rfq.deadline), "MMM d, yyyy")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quotations</CardTitle>
              <CardDescription>
                {quotations?.length || 0} received out of {rfq.assignedVendorIds.length} invited
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isQuotationsLoading ? (
                <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
              ) : quotations && quotations.length > 0 ? (
                <div className="space-y-3">
                  {quotations.map(q => (
                    <div key={q.id} className="flex justify-between items-center p-3 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{q.vendorName}</span>
                      </div>
                      <div className="text-sm font-semibold">${q.totalAmount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                  No quotations received yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
