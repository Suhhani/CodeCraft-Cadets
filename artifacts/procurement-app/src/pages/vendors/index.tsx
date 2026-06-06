import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, Filter, MoreHorizontal, Building2, MapPin, Mail, Phone, ExternalLink } from "lucide-react";
import { useListVendors, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function VendorsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: vendors, isLoading } = useListVendors({ search: searchTerm });
  const { data: user } = useGetMe();
  
  const isProcurementOfficer = user?.role === "procurement_officer" || user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Vendors</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage supplier relationships and performance</p>
        </div>
        {isProcurementOfficer && (
          <Link href="/vendors/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Register Vendor
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search vendors by name, category..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto gap-2 bg-background">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[300px]">Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-24 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : vendors?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No vendors found
                </TableCell>
              </TableRow>
            ) : (
              vendors?.map((vendor) => (
                <TableRow key={vendor.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="font-medium text-foreground">{vendor.companyName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {vendor.address || 'No address'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-xs">{vendor.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{vendor.contactPerson}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{vendor.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={vendor.status === 'active' ? 'default' : vendor.status === 'pending' ? 'outline' : 'secondary'} 
                           className={vendor.status === 'active' ? 'bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20' : ''}>
                      {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      {vendor.rating ? (
                        <>
                          <span className="text-amber-500">★</span>
                          {vendor.rating.toFixed(1)}
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <Link href={`/vendors/${vendor.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <ExternalLink className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
