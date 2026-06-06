import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, MoreHorizontal, ExternalLink, Building2 } from "lucide-react";
import { useListVendors, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StatusFilter = "all" | "active" | "inactive" | "pending";

export function VendorsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { data: vendors, isLoading } = useListVendors({ search: searchTerm });
  const { data: user } = useGetMe();
  const isProcurementOfficer = user?.role === "procurement_officer" || user?.role === "admin";

  const filtered = vendors?.filter((v) =>
    statusFilter === "all" ? true : v.status === statusFilter
  );

  const tabCounts = {
    all: vendors?.length ?? 0,
    active: vendors?.filter((v) => v.status === "active").length ?? 0,
    inactive: vendors?.filter((v) => v.status === "inactive").length ?? 0,
    pending: vendors?.filter((v) => v.status === "pending").length ?? 0,
  };

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
    { key: "pending", label: "Pending" },
  ];

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 font-normal text-xs">Active</Badge>;
    if (status === "pending") return <Badge variant="outline" className="text-amber-600 border-amber-300 font-normal text-xs">Pending</Badge>;
    return <Badge variant="secondary" className="font-normal text-xs capitalize">{status}</Badge>;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage supplier profiles and registrations</p>
        </div>
        {isProcurementOfficer && (
          <Link href="/vendors/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Vendor
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, category..."
              className="pl-8 h-8 text-sm bg-muted/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-1 border border-border rounded-md p-0.5 bg-muted/30">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  statusFilter === tab.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-[10px] text-muted-foreground">{tabCounts[tab.key]}</span>
              </button>
            ))}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs font-semibold">Company</TableHead>
              <TableHead className="text-xs font-semibold">Category</TableHead>
              <TableHead className="text-xs font-semibold">GST No.</TableHead>
              <TableHead className="text-xs font-semibold">Contact</TableHead>
              <TableHead className="text-xs font-semibold">Email</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold">Rating</TableHead>
              <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No vendors found
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((vendor) => (
                <TableRow key={vendor.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="font-medium text-sm text-foreground">{vendor.companyName}</div>
                    {vendor.address && (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">{vendor.address}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-xs">{vendor.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">
                      {vendor.gstNumber || <span className="text-muted-foreground/50">—</span>}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{vendor.contactPerson}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{vendor.email}</TableCell>
                  <TableCell>{statusBadge(vendor.status)}</TableCell>
                  <TableCell>
                    {vendor.rating ? (
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span className="text-amber-500">★</span>
                        {vendor.rating.toFixed(1)}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/vendors/${vendor.id}`}>
                          <DropdownMenuItem className="cursor-pointer text-sm">
                            <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Details
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
