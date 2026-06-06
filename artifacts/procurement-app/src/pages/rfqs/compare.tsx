import { useRoute, Link, useLocation } from "wouter";
import {
  useCompareQuotations,
  useUpdateRfq,
  useUpdateQuotation,
  getCompareQuotationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, ThumbsUp } from "lucide-react";

export function RfqCompare() {
  const [, params] = useRoute("/rfqs/:id/compare");
  const rfqId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comparison, isLoading } = useCompareQuotations(rfqId, { query: { enabled: !!rfqId } });
  const updateRfq = useUpdateRfq();
  const updateQuotation = useUpdateQuotation();

  const handleAward = (quotationId: number, vendorName: string) => {
    updateQuotation.mutate(
      { id: quotationId, data: { status: "accepted" } },
      {
        onSuccess: () => {
          updateRfq.mutate(
            { id: rfqId, data: { status: "awarded" } },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getCompareQuotationsQueryKey(rfqId) });
                toast({ title: "Contract Awarded", description: `RFQ awarded to ${vendorName}.` });
                setLocation(`/rfqs/${rfqId}`);
              },
            }
          );
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-5 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!comparison || comparison.quotations.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-2">No quotations to compare</h2>
        <p className="text-muted-foreground mb-6 text-sm">Vendors haven't submitted any quotations yet.</p>
        <Link href={`/rfqs/${rfqId}`}>
          <Button variant="outline" size="sm">Back to RFQ</Button>
        </Link>
      </div>
    );
  }

  const quotations = comparison.quotations;
  const lowestId = comparison.lowestPriceVendorId;
  const fastestId = comparison.fastestDeliveryVendorId;

  // Find lowest total amount
  const lowestAmount = Math.min(...quotations.map((q) => q.totalAmount));

  // Criteria row definitions
  const criteriaRows: { label: string; render: (q: typeof quotations[0], isLowest: boolean) => React.ReactNode }[] = [
    {
      label: "Total Price",
      render: (q, isLowest) => (
        <span className={`font-bold text-base ${isLowest ? "text-green-700" : "text-foreground"}`}>
          ₹{q.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      label: "Delivery Timeline",
      render: (q, isLowest) => (
        <span className={`text-sm ${q.vendorId === fastestId ? "text-blue-600 font-semibold" : "text-foreground"}`}>
          {q.deliveryTimeline}
        </span>
      ),
    },
    {
      label: "Submitted On",
      render: (q) => (
        <span className="text-sm text-muted-foreground">
          {new Date(q.submittedAt).toLocaleDateString("en-IN")}
        </span>
      ),
    },
    {
      label: "Line Items Count",
      render: (q) => (
        <span className="text-sm">{q.items.length} item{q.items.length !== 1 ? "s" : ""}</span>
      ),
    },
    {
      label: "Notes / Terms",
      render: (q) => (
        <span className="text-xs text-muted-foreground italic">
          {q.notes || "—"}
        </span>
      ),
    },
    {
      label: "Item Breakdown",
      render: (q, isLowest) => (
        <div className="space-y-1">
          {q.items.map((item, i) => (
            <div key={i} className="text-xs flex justify-between gap-4">
              <span className="text-muted-foreground truncate">{item.rfqItemName}</span>
              <span className="font-medium whitespace-nowrap">₹{item.totalPrice.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLocation(`/rfqs/${rfqId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quotation Comparison</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{comparison.rfqTitle}</p>
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                {/* Criteria header */}
                <th className="bg-muted/40 border-b border-r border-border px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-36">
                  Criteria
                </th>
                {/* Vendor headers */}
                {quotations.map((q) => {
                  const isLowest = q.vendorId === lowestId;
                  return (
                    <th
                      key={q.id}
                      className={`border-b border-r border-border px-4 py-3 text-left last:border-r-0 ${
                        isLowest ? "bg-green-50" : "bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${isLowest ? "text-green-800" : "text-foreground"}`}>
                          {q.vendorName}
                        </span>
                        {isLowest && (
                          <span className="text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">
                            LOWEST
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {criteriaRows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                  {/* Criteria label */}
                  <td className="border-r border-b border-border px-4 py-3 text-xs font-semibold text-muted-foreground bg-muted/10 whitespace-nowrap">
                    {row.label}
                  </td>
                  {/* Vendor values */}
                  {quotations.map((q) => {
                    const isLowest = q.vendorId === lowestId;
                    return (
                      <td
                        key={q.id}
                        className={`border-r border-b border-border px-4 py-3 last:border-r-0 ${
                          isLowest ? "bg-green-50/40" : ""
                        }`}
                      >
                        {row.render(q, isLowest)}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Select / Approve row */}
              <tr className="bg-muted/5">
                <td className="border-r border-border px-4 py-4 text-xs font-semibold text-muted-foreground bg-muted/10">
                  Action
                </td>
                {quotations.map((q) => {
                  const isLowest = q.vendorId === lowestId;
                  return (
                    <td
                      key={q.id}
                      className={`border-r border-border px-4 py-4 last:border-r-0 ${
                        isLowest ? "bg-green-50/40" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant={isLowest ? "default" : "outline"}
                          className={`gap-1.5 w-full text-xs ${
                            isLowest ? "bg-green-600 hover:bg-green-700 text-white" : ""
                          }`}
                          onClick={() => handleAward(q.id, q.vendorName)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Select & Approve
                        </Button>
                        {!isLowest && (
                          <Button size="sm" variant="ghost" className="gap-1.5 w-full text-xs text-muted-foreground">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            Select
                          </Button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <div className="border-t border-border px-5 py-3 bg-muted/20 flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            <strong className="text-foreground">Green</strong> = Lowest price vendor
          </span>
          <span className="text-muted-foreground/40 mx-1">•</span>
          <span className="text-xs text-muted-foreground">
            {quotations.length} quotation{quotations.length !== 1 ? "s" : ""} received for this RFQ
          </span>
        </div>
      </div>
    </div>
  );
}
