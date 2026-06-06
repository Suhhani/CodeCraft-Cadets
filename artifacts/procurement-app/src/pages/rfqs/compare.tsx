import { useRoute, Link, useLocation } from "wouter";
import { useCompareQuotations, useUpdateRfq, useUpdateQuotation, useCreateApproval, getCompareQuotationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trophy, Clock, CheckCircle2 } from "lucide-react";

export function RfqCompare() {
  const [, params] = useRoute("/rfqs/:id/compare");
  const rfqId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comparison, isLoading } = useCompareQuotations(rfqId, {
    query: { enabled: !!rfqId }
  });

  const updateRfq = useUpdateRfq();
  const updateQuotation = useUpdateQuotation();
  // Note: Approvals require custom API hook if using real approvals flow, we'll just award directly here.

  const handleAward = (quotationId: number, vendorName: string) => {
    // 1. Update quotation status to accepted
    updateQuotation.mutate(
      { id: quotationId, data: { status: 'accepted' } },
      {
        onSuccess: () => {
          // 2. Update RFQ status to awarded
          updateRfq.mutate(
            { id: rfqId, data: { status: 'awarded' } },
            {
              onSuccess: () => {
                toast({
                  title: "Contract Awarded",
                  description: `RFQ has been awarded to ${vendorName}.`,
                });
                setLocation(`/rfqs/${rfqId}`);
              }
            }
          );
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96" /><Skeleton className="h-96" /><Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!comparison || comparison.quotations.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-2">No quotations to compare</h2>
        <p className="text-muted-foreground mb-6">Vendors haven't submitted any quotations for this RFQ yet.</p>
        <Link href={`/rfqs/${rfqId}`}>
          <Button variant="outline">Back to RFQ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto overflow-x-hidden">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation(`/rfqs/${rfqId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Compare Quotations</h1>
          <p className="text-muted-foreground text-sm mt-1">{comparison.rfqTitle}</p>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
        {comparison.quotations.map((q) => {
          const isLowestPrice = q.vendorId === comparison.lowestPriceVendorId;
          const isFastestDelivery = q.vendorId === comparison.fastestDeliveryVendorId;
          
          return (
            <Card key={q.id} className="min-w-[350px] w-full max-w-[400px] flex-shrink-0 snap-center flex flex-col">
              <CardHeader className={`${isLowestPrice ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-muted/30'} border-b`}>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{q.vendorName}</CardTitle>
                    <CardDescription className="mt-1">
                      Submitted {new Date(q.submittedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {isLowestPrice && (
                    <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 p-1.5 rounded-full" title="Lowest Price">
                      <Trophy className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 flex-1 flex flex-col">
                <div className="space-y-6 flex-1">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className={`text-3xl font-bold tracking-tight ${isLowestPrice ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      ${q.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Delivery Timeline</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-md bg-muted/30">
                      <Clock className={`h-4 w-4 ${isFastestDelivery ? 'text-blue-500' : ''}`} />
                      <span className={isFastestDelivery ? 'font-medium text-blue-600 dark:text-blue-400' : ''}>
                        {q.deliveryTimeline}
                      </span>
                    </div>
                  </div>

                  {q.notes && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Vendor Notes</p>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md italic">
                        "{q.notes}"
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Line Items</p>
                    <div className="space-y-2">
                      {q.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-2 border-b border-border/50 last:border-0">
                          <div className="flex flex-col">
                            <span className="font-medium">{item.rfqItemName}</span>
                            <span className="text-xs text-muted-foreground">{item.quantity} units @ ${item.unitPrice}</span>
                          </div>
                          <span className="font-medium">${item.totalPrice.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-auto">
                  <Button 
                    className="w-full gap-2" 
                    variant={isLowestPrice ? "default" : "outline"}
                    onClick={() => handleAward(q.id, q.vendorName)}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Award Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
