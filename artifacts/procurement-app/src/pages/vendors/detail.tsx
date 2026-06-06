import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Save, ArrowLeft, Mail, Phone, MapPin, Map, Star, Trash2 } from "lucide-react";
import { useGetVendor, useUpdateVendor, useDeleteVendor, getGetVendorQueryKey, getListVendorsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const vendorUpdateSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  category: z.string().min(2, "Category is required"),
  status: z.enum(["active", "inactive", "pending"]),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
});

type VendorUpdateFormValues = z.infer<typeof vendorUpdateSchema>;

export function VendorDetail() {
  const [, params] = useRoute("/vendors/:id");
  const vendorId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: vendor, isLoading } = useGetVendor(vendorId, {
    query: {
      enabled: !!vendorId,
    }
  });
  
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<VendorUpdateFormValues>({
    resolver: zodResolver(vendorUpdateSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      gstNumber: "",
      category: "",
      status: "pending",
      rating: undefined,
    },
  });

  useEffect(() => {
    if (vendor) {
      form.reset({
        companyName: vendor.companyName,
        contactPerson: vendor.contactPerson,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address || "",
        gstNumber: vendor.gstNumber || "",
        category: vendor.category,
        status: vendor.status,
        rating: vendor.rating,
      });
    }
  }, [vendor, form]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vendor) return <div>Vendor not found</div>;

  const onSubmit = (data: VendorUpdateFormValues) => {
    updateVendor.mutate(
      { 
        id: vendorId, 
        data: {
          ...data,
          rating: data.rating === null ? undefined : data.rating
        } 
      },
      {
        onSuccess: (updatedVendor) => {
          queryClient.invalidateQueries({ queryKey: getGetVendorQueryKey(vendorId) });
          queryClient.invalidateQueries({ queryKey: getListVendorsQueryKey() });
          toast({
            title: "Vendor updated",
            description: "Vendor details have been successfully updated.",
          });
          setIsEditing(false);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update vendor. Please try again.",
          });
        },
      }
    );
  };

  const handleDelete = () => {
    deleteVendor.mutate(
      { id: vendorId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVendorsQueryKey() });
          toast({
            title: "Vendor deleted",
            description: "Vendor has been successfully removed.",
          });
          setLocation("/vendors");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete vendor.",
          });
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/vendors")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{vendor.companyName}</h1>
              <Badge variant={vendor.status === 'active' ? 'default' : vendor.status === 'pending' ? 'outline' : 'secondary'} 
                     className={vendor.status === 'active' ? 'bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20' : ''}>
                {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">Vendor details and performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button onClick={() => setIsEditing(true)}>Edit Details</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the vendor
                      and any associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </div>
      </div>

      {!isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Company Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Company Name</h4>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {vendor.companyName}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                  <div className="text-foreground">{vendor.category}</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Contact Person</h4>
                  <div className="text-foreground">{vendor.contactPerson}</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Tax/GST Number</h4>
                  <div className="text-foreground font-mono">{vendor.gstNumber || "Not provided"}</div>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Physical Address</h4>
                  <div className="flex items-start gap-2 text-foreground">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{vendor.address || "Not provided"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-md text-primary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium truncate">{vendor.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-md text-primary">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{vendor.phone}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="flex items-center gap-1 text-3xl font-bold">
                    {vendor.rating ? (
                      <>
                        <span>{vendor.rating.toFixed(1)}</span>
                        <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                      </>
                    ) : (
                      <span className="text-muted-foreground text-xl">Not rated</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">Overall Vendor Rating</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Edit Vendor Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Category *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (0-5)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0" 
                          max="5" 
                          {...field} 
                          value={field.value || ''} 
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax/GST Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Physical Address</FormLabel>
                      <FormControl>
                        <Textarea className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateVendor.isPending} className="gap-2">
                <Save className="h-4 w-4" /> 
                {updateVendor.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
