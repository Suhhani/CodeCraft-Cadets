import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, ArrowLeft, Building2 } from "lucide-react";
import { useGetRfq, useCreateQuotation, useGetMe, getListQuotationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const quotationSchema = z.object({
  items: z.array(z.object({
    rfqItemName: z.string(),
    quantity: z.number(),
    unitPrice: z.coerce.number().min(0.01, "Unit price must be > 0"),
    totalPrice: z.number(),
  })),
  deliveryTimeline: z.string().min(2, "Delivery timeline is required"),
  notes: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

export function QuotationNew() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const rfqIdStr = searchParams.get('rfqId');
  const rfqId = rfqIdStr ? parseInt(rfqIdStr, 10) : 0;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  
  // Need to know which vendor is submitting. Assuming current user's company is linked, but API design has vendorId. 
  // For mockup purposes, we'll use a hardcoded vendorId if not provided or extract from somewhere. Let's just use 1.
  const vendorId = 1; 

  const { data: rfq, isLoading: rfqLoading } = useGetRfq(rfqId, {
    query: { enabled: !!rfqId }
  });

  const createQuotation = useCreateQuotation();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      items: [],
      deliveryTimeline: "",
      notes: "",
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch items to calculate totals
  const watchedItems = form.watch("items");
  const totalAmount = watchedItems.reduce((sum, item) => sum + ((item.unitPrice || 0) * item.quantity), 0);

  // Initialize form with RFQ items when RFQ loads
  useEffect(() => {
    if (rfq && fields.length === 0) {
      form.reset({
        deliveryTimeline: "",
        notes: "",
        items: rfq.items.map(item => ({
          rfqItemName: item.name,
          quantity: item.quantity,
          unitPrice: 0,
          totalPrice: 0,
        }))
      });
    }
  }, [rfq, form, fields.length]);

  const onSubmit = (data: QuotationFormValues) => {
    if (!rfqId) return;

    // Recalculate exact totals before sending
    const finalItems = data.items.map(item => ({
      ...item,
      totalPrice: item.unitPrice * item.quantity
    }));
    
    const finalTotalAmount = finalItems.reduce((sum, item) => sum + item.totalPrice, 0);

    createQuotation.mutate(
      { 
        data: { 
          rfqId,
          vendorId,
          items: finalItems,
          totalAmount: finalTotalAmount,
          deliveryTimeline: data.deliveryTimeline,
          notes: data.notes
        } 
      },
      {
        onSuccess: (quotation) => {
          queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey() });
          toast({
            title: "Quotation submitted",
            description: "Your proposal has been sent for review.",
          });
          setLocation(`/quotations/${quotation.id}`);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to submit quotation. Please try again.",
          });
        },
      }
    );
  };

  if (!rfqId) {
    return <div>No RFQ selected. Go back to RFQs to submit a quotation.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation(`/rfqs/${rfqId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Submit Quotation</h1>
          <p className="text-muted-foreground text-sm mt-1">For RFQ: {rfq?.title || "Loading..."}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing Details</CardTitle>
              <CardDescription>Provide unit pricing for all requested line items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right w-24">Qty</TableHead>
                      <TableHead className="w-40">Unit Price ($)</TableHead>
                      <TableHead className="text-right w-32">Total ($)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const qty = watchedItems[index]?.quantity || 0;
                      const up = watchedItems[index]?.unitPrice || 0;
                      const total = qty * up;
                      
                      return (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium">
                            {watchedItems[index]?.rfqItemName}
                          </TableCell>
                          <TableCell className="text-right">
                            {qty}
                          </TableCell>
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
                                      className="h-8"
                                      {...field} 
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="bg-muted/30 p-4 border-t flex justify-end items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">Total Quotation Value:</span>
                  <span className="text-2xl font-bold text-foreground">
                    ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Terms & Notes</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="deliveryTimeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Timeline *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 2-3 weeks from PO confirmation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any terms, conditions, or exclusions..." 
                        className="resize-none min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation(`/rfqs/${rfqId}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createQuotation.isPending || totalAmount === 0} className="gap-2">
              <Save className="h-4 w-4" /> 
              {createQuotation.isPending ? "Submitting..." : "Submit Quotation"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
