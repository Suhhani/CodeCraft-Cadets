import { useState } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useCreateRfq, useListVendors, getListRfqsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

const rfqSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  deadline: z.string().min(1, "Deadline is required"),
  items: z.array(z.object({
    name: z.string().min(1, "Item name is required"),
    description: z.string().optional(),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    unit: z.string().min(1, "Unit is required")
  })).min(1, "At least one item is required"),
  assignedVendorIds: z.array(z.number()).min(1, "Assign at least one vendor"),
});

type RfqFormValues = z.infer<typeof rfqSchema>;

export function RfqNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createRfq = useCreateRfq();
  const { data: vendors } = useListVendors({ status: 'active' });

  const form = useForm<RfqFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: "",
      items: [{ name: "", description: "", quantity: 1, unit: "pcs" }],
      assignedVendorIds: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = (data: RfqFormValues) => {
    // Format deadline properly if it's just a date
    let formattedDeadline = data.deadline;
    if (formattedDeadline.length === 10) { // YYYY-MM-DD
      formattedDeadline = `${formattedDeadline}T23:59:59Z`;
    }

    createRfq.mutate(
      { 
        data: { 
          ...data, 
          deadline: formattedDeadline 
        } 
      },
      {
        onSuccess: (rfq) => {
          queryClient.invalidateQueries({ queryKey: getListRfqsQueryKey() });
          toast({
            title: "RFQ created",
            description: "The Request for Quotation has been created and sent.",
          });
          setLocation(`/rfqs/${rfq.id}`);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create RFQ. Please try again.",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/rfqs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Request for Quotation</h1>
          <p className="text-muted-foreground text-sm mt-1">Define requirements and invite vendors to bid</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> RFQ Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Office Supplies Q3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed requirements or instructions for vendors..." 
                            className="resize-none min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission Deadline *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                    <CardDescription>Specify the products or services needed</CardDescription>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => append({ name: "", description: "", quantity: 1, unit: "pcs" })}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-start p-4 border rounded-lg bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
                        <div className="md:col-span-5">
                          <FormField
                            control={form.control}
                            name={`items.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Item Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Product name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="md:col-span-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Specifications</FormLabel>
                                <FormControl>
                                  <Input placeholder="Optional details" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Qty *</FormLabel>
                                <FormControl>
                                  <Input type="number" min="1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="md:col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.unit`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Unit *</FormLabel>
                                <FormControl>
                                  <Input placeholder="pcs" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      {fields.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="mt-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {form.formState.errors.items?.root && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.items.root.message}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Invite Vendors</CardTitle>
                  <CardDescription>Select active vendors to receive this RFQ</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden flex flex-col">
                  <FormField
                    control={form.control}
                    name="assignedVendorIds"
                    render={() => (
                      <FormItem className="flex-1 flex flex-col min-h-[300px]">
                        <ScrollArea className="flex-1 border rounded-md p-4">
                          <div className="space-y-4">
                            {vendors?.map((vendor) => (
                              <FormField
                                key={vendor.id}
                                control={form.control}
                                name="assignedVendorIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={vendor.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(vendor.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, vendor.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== vendor.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-medium leading-none cursor-pointer">
                                        <div className="flex flex-col">
                                          <span>{vendor.companyName}</span>
                                          <span className="text-xs text-muted-foreground font-normal">
                                            {vendor.category} • Rating: {vendor.rating || 'N/A'}
                                          </span>
                                        </div>
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                            {(!vendors || vendors.length === 0) && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No active vendors found.
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                        <FormMessage className="mt-2" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => setLocation("/rfqs")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRfq.isPending} className="gap-2">
              <Save className="h-4 w-4" /> 
              {createRfq.isPending ? "Publishing..." : "Publish RFQ"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
