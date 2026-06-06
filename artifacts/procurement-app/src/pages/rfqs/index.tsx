import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, Filter, MoreHorizontal, FileText, Clock, FileCheck } from "lucide-react";
import { useListRfqs, useGetMe } from "@workspace/api-client-react";
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
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RfqList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: rfqs, isLoading } = useListRfqs({ search: searchTerm });
  const { data: user } = useGetMe();
  
  const isProcurementOfficer = user?.role === "procurement_officer" || user?.role === "admin";

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20';
      case 'closed': return 'bg-amber-600/10 text-amber-600 border-amber-600/20';
      case 'awarded': return 'bg-blue-600/10 text-blue-600 border-blue-600/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Requests for Quotation</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage bidding events and vendor sourcing</p>
        </div>
        {isProcurementOfficer && (
          <Link href="/rfqs/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create RFQ
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search RFQs by title, number..." 
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
              <TableHead className="w-[300px]">RFQ Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-24 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : rfqs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No RFQs found
                </TableCell>
              </TableRow>
            ) : (
              rfqs?.map((rfq) => (
                <TableRow key={rfq.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="font-medium text-foreground">{rfq.title}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{rfq.rfqNumber}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-medium ${getStatusColor(rfq.status)}`}>
                      {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1).replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{rfq.items.length}</div>
                    <div className="text-xs text-muted-foreground">line items</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{format(new Date(rfq.createdAt), "MMM d, yyyy")}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(rfq.deadline), "MMM d, yyyy")}
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
                        <Link href={`/rfqs/${rfq.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <FileText className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                        </Link>
                        {isProcurementOfficer && rfq.status === 'closed' && (
                          <Link href={`/rfqs/${rfq.id}/compare`}>
                            <DropdownMenuItem className="cursor-pointer font-medium text-primary">
                              <FileCheck className="mr-2 h-4 w-4" /> Compare Quotations
                            </DropdownMenuItem>
                          </Link>
                        )}
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
