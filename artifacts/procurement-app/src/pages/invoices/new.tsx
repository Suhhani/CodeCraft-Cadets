import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Receipt, Save, ArrowLeft } from "lucide-react";
import { useCreateInvoice, useGetPurchaseOrder, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const invoiceSchema = z.object({
  purchaseOrderId: z.coerce.number().min(1, "PO reference is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function InvoiceNew() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const poIdStr = searchParams.get('purchaseOrderId');
  const initialPoId = poIdStr ? parseInt(poIdStr, 10) : 0;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createInvoice = useCreateInvoice();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      purchaseOrderId: initialPoId || 0,
      dueDate: "",
    },
  });

  const watchedPoId = form.watch("purchaseOrderId");
  
  const { data: po, isLoading: poLoading } = useGetPurchaseOrder(watchedPoId, {
    query: { enabled: !!watchedPoId && watchedPoId > 0 }
  });

  const onSubmit = (data: InvoiceFormValues) => {
    let formattedDueDate = data.dueDate;
    if (formattedDueDate && formattedDueDate.length === 10) {
      formattedDueDate = `${formattedDueDate}T23:59:59Z`;
    }

    createInvoice.mutate(
      { 
        data: { 
          purchaseOrderId: data.purchaseOrderId,
          dueDate: formattedDueDate
        } 
      },
      {
        onSuccess: (invoice) => {
          queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
          toast({
            title: "Invoice Generated",
            description: "Invoice has been successfully created from the PO.",
          });
          setLocation(`/invoices/${invoice.id}`);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to generate invoice. Please try again.",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Generate Invoice</h1>
          <p className="text-muted-foreground text-sm mt-1">Create an invoice from an existing Purchase Order</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" /> Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="purchaseOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Order ID *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {po && (
                <div className="bg-muted/30 p-4 rounded-md border text-sm space-y-2">
                  <div className="font-semibold text-foreground border-b pb-2 mb-2">PO Preview ({po.poNumber})</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendor:</span>
                    <span>{po.vendorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">${po.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Due Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/invoices")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvoice.isPending || !po} className="gap-2">
              <Save className="h-4 w-4" /> 
              {createInvoice.isPending ? "Generating..." : "Generate Invoice"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
