import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShoppingCart, Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useCreatePurchaseOrder, useListVendors, getListPurchaseOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const poSchema = z.object({
  vendorId: z.coerce.number().min(1, "Vendor is required"),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate max is 100"),
  deliveryDate: z.string().optional(),
  items: z.array(z.object({
    name: z.string().min(1, "Item name is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    unit: z.string().min(1, "Unit is required"),
    unitPrice: z.coerce.number().min(0.01, "Unit price must be > 0"),
  })).min(1, "At least one item is required"),
});

type PoFormValues = z.infer<typeof poSchema>;

export function PurchaseOrderNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPurchaseOrder = useCreatePurchaseOrder();
  
  const { data: vendors } = useListVendors({ status: 'active' });

  const form = useForm<PoFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      vendorId: 0,
      taxRate: 0,
      deliveryDate: "",
      items: [{ name: "", quantity: 1, unit: "pcs", unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const watchedTaxRate = form.watch("taxRate") || 0;
  
  const subtotal = watchedItems.reduce((sum, item) => sum + ((item.unitPrice || 0) * (item.quantity || 0)), 0);
  const taxAmount = subtotal * (watchedTaxRate / 100);
  const totalAmount = subtotal + taxAmount;

  const onSubmit = (data: PoFormValues) => {
    let formattedDeliveryDate = data.deliveryDate;
    if (formattedDeliveryDate && formattedDeliveryDate.length === 10) {
      formattedDeliveryDate = `${formattedDeliveryDate}T23:59:59Z`;
    }

    const itemsWithTotals = data.items.map(item => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice
    }));

    createPurchaseOrder.mutate(
      { 
        data: { 
          vendorId: data.vendorId,
          taxRate: data.taxRate,
          deliveryDate: formattedDeliveryDate || undefined,
          items: itemsWithTotals
        } 
      },
      {
        onSuccess: (po) => {
          queryClient.invalidateQueries({ queryKey: getListPurchaseOrdersQueryKey() });
          toast({
            title: "Purchase Order Drafted",
            description: "PO has been successfully created.",
          });
          setLocation(`/purchase-orders/${po.id}`);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create PO. Please try again.",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/purchase-orders")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Purchase Order</h1>
          <p className="text-muted-foreground text-sm mt-1">Draft a new PO to send to a vendor</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor *</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value ? field.value.toString() : undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors?.map(v => (
                          <SelectItem key={v.id} value={v.id.toString()}>{v.companyName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Delivery Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Line Items</CardTitle>
                <CardDescription>Add products or services for this order</CardDescription>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ name: "", quantity: 1, unit: "pcs", unitPrice: 0 })}
                className="gap-1"
              >
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden mb-6">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24 text-right">Qty</TableHead>
                      <TableHead className="w-24">Unit</TableHead>
                      <TableHead className="w-32 text-right">Unit Price</TableHead>
                      <TableHead className="w-32 text-right">Total</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const qty = watchedItems[index]?.quantity || 0;
                      const up = watchedItems[index]?.unitPrice || 0;
                      const total = qty * up;
                      
                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.name`}
                              render={({ field }) => (
                                <FormItem className="mb-0">
                                  <FormControl><Input placeholder="Item name" className="h-8" {...field} /></FormControl>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem className="mb-0">
                                  <FormControl><Input type="number" min="1" className="h-8 text-right" {...field} /></FormControl>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.unit`}
                              render={({ field }) => (
                                <FormItem className="mb-0">
                                  <FormControl><Input className="h-8" {...field} /></FormControl>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem className="mb-0">
                                  <FormControl><Input type="number" step="0.01" min="0" className="h-8 text-right" {...field} /></FormControl>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium align-middle">
                            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            {fields.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-end gap-3 w-full md:w-1/3 ml-auto">
                <div className="flex justify-between w-full text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between items-center w-full text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Tax Rate (%):</span>
                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem className="mb-0 w-16">
                          <FormControl><Input type="number" step="0.1" min="0" className="h-7 text-right" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <span className="font-medium">${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between w-full text-base font-bold pt-3 border-t mt-2">
                  <span>Total Amount:</span>
                  <span>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/purchase-orders")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPurchaseOrder.isPending || totalAmount === 0} className="gap-2">
              <Save className="h-4 w-4" /> 
              {createPurchaseOrder.isPending ? "Creating..." : "Create PO"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
