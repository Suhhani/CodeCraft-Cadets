import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Trash2, FileText, Clock, Hash, Building2, Save } from "lucide-react";
import {
  useGetRfq,
  useCreateQuotation,
  useGetMe,
  getListQuotationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const quotationSchema = z.object({
  items: z.array(z.object({
    rfqItemName: z.string(),
    quantity: z.number(),
    unitPrice: z.coerce.number().min(0.01, "Required"),
    totalPrice: z.number(),
  })),
  deliveryTimeline: z.string().min(2, "Delivery timeline is required"),
  gstPercent: z.coerce.number().min(0).max(100).default(18),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

export function QuotationNew() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const rfqId = parseInt(searchParams.get("rfqId") || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  const vendorId = 1;

  const { data: rfq, isLoading: rfqLoading } = useGetRfq(rfqId, { query: { enabled: !!rfqId } });
  const createQuotation = useCreateQuotation();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { items: [], deliveryTimeline: "", gstPercent: 18, terms: "", notes: "" },
  });

  const { fields } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = form.watch("items");
  const gstPercent = form.watch("gstPercent") || 0;

  const subtotal = watchedItems.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);
  const gstAmount = subtotal * (gstPercent / 100);
  const grandTotal = subtotal + gstAmount;

  useEffect(() => {
    if (rfq && fields.length === 0) {
      form.reset({
        deliveryTimeline: "",
        gstPercent: 18,
        terms: "",
        notes: "",
        items: rfq.items.map((item) => ({
          rfqItemName: item.name,
          quantity: item.quantity,
          unitPrice: 0,
          totalPrice: 0,
        })),
      });
    }
  }, [rfq, form, fields.length]);

  const submitForm = (data: QuotationFormValues, isDraft = false) => {
    if (!rfqId) return;
    const finalItems = data.items.map((item) => ({
      ...item,
      totalPrice: item.unitPrice * item.quantity,
    }));
    const finalTotal = finalItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const gstAmt = finalTotal * (data.gstPercent / 100);

    createQuotation.mutate(
      {
        data: {
          rfqId,
          vendorId,
          items: finalItems,
          totalAmount: finalTotal + gstAmt,
          deliveryTimeline: data.deliveryTimeline,
          notes: [data.terms, data.notes].filter(Boolean).join(" | ") || undefined,
        },
      },
      {
        onSuccess: (quotation) => {
          queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey() });
          toast({
            title: isDraft ? "Draft saved" : "Quotation submitted",
            description: isDraft ? "Saved as draft." : "Your proposal has been sent for review.",
          });
          setLocation(`/quotations/${quotation.id}`);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed. Please try again." });
        },
      }
    );
  };

  if (!rfqId) return <div className="p-8 text-muted-foreground">No RFQ selected. Go back and choose an RFQ first.</div>;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLocation(`/rfqs/${rfqId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Submit Quotation</h1>
          <p className="text-sm text-muted-foreground">
            {rfq ? `For: ${rfq.title}` : "Loading RFQ..."}
          </p>
        </div>
      </div>

      {/* RFQ Summary */}
      {rfq && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              RFQ Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Hash className="h-3 w-3" /> RFQ No.
                </p>
                <p className="text-sm font-semibold font-mono">{rfq.rfqNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Title
                </p>
                <p className="text-sm font-semibold truncate">{rfq.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Deadline
                </p>
                <p className="text-sm font-semibold text-destructive">
                  {format(new Date(rfq.deadline), "dd MMM yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                <Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-medium">
                  {rfq.status.toUpperCase()}
                </Badge>
              </div>
            </div>
            {rfq.description && (
              <p className="text-xs text-muted-foreground mt-3 border-t pt-3">{rfq.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form>
          {/* Your Quotation table */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Your Quotation
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-xs font-semibold pl-5">Item</TableHead>
                      <TableHead className="text-right text-xs font-semibold w-20">Qty</TableHead>
                      <TableHead className="text-xs font-semibold w-36">Unit Price (₹)</TableHead>
                      <TableHead className="text-right text-xs font-semibold w-32">Total (₹)</TableHead>
                      <TableHead className="text-xs font-semibold w-40">Delivery</TableHead>
                      <TableHead className="text-center text-xs font-semibold w-16">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfqLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <TableCell key={j}><div className="h-4 bg-muted/60 rounded animate-pulse" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : fields.map((field, index) => {
                      const qty = watchedItems[index]?.quantity || 0;
                      const up = watchedItems[index]?.unitPrice || 0;
                      const rowTotal = qty * up;
                      return (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium text-sm pl-5">
                            {watchedItems[index]?.rfqItemName}
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {rfq?.items[index]?.description}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">{qty}</TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem className="mb-0">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      className="h-8 text-sm"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            {rowTotal > 0 ? `₹${rowTotal.toLocaleString("en-IN")}` : "—"}
                          </TableCell>
                          <TableCell>
                            {index === 0 ? (
                              <FormField
                                control={form.control}
                                name="deliveryTimeline"
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        placeholder="e.g. 21 days"
                                        className="h-8 text-xs"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {form.watch("deliveryTimeline") || "—"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              disabled
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Totals + GST + Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 border-t">
                {/* Left: GST% and Terms */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      GST %
                    </label>
                    <FormField
                      control={form.control}
                      name="gstPercent"
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              className="h-8 text-sm w-28"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Terms & Conditions
                    </label>
                    <FormField
                      control={form.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Textarea
                              placeholder="Payment terms, warranty, exclusions..."
                              className="resize-none text-sm h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Additional Notes (Optional)
                    </label>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Textarea
                              placeholder="Any other remarks..."
                              className="resize-none text-sm h-16"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Right: Totals */}
                <div className="flex flex-col justify-between">
                  <div className="bg-muted/30 rounded-lg border p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST ({gstPercent}%)</span>
                      <span className="font-medium">₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-bold text-base">Grand Total</span>
                      <span className="font-bold text-lg text-primary">
                        ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    <Button
                      type="button"
                      className="gap-2"
                      disabled={createQuotation.isPending || subtotal === 0}
                      onClick={form.handleSubmit((data) => submitForm(data, false))}
                    >
                      <FileText className="h-4 w-4" />
                      {createQuotation.isPending ? "Submitting..." : "Submit Quotation"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      disabled={createQuotation.isPending}
                      onClick={form.handleSubmit((data) => submitForm(data, true))}
                    >
                      <Save className="h-4 w-4" /> Save Draft
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => setLocation(`/rfqs/${rfqId}`)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
