import { useState } from "react";
import { Link } from "wouter";
import { MessageSquare, Search, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useListQuotations, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export function QuotationsList() {
  const [searchTerm, setSearchTerm] = useState("");
  // In a real app we'd filter by search, but API doesn't support search param directly here
  const { data: quotations, isLoading } = useListQuotations({});
  const { data: user } = useGetMe();
  
  const isVendor = user?.role === "vendor";

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-600/10 text-blue-600 border-blue-600/20';
      case 'under_review': return 'bg-amber-600/10 text-amber-600 border-amber-600/20';
      case 'accepted': return 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Quotations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isVendor ? "Manage your submitted bids and proposals" : "Review vendor submissions and pricing"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>RFQ Reference</TableHead>
              {!isVendor && <TableHead>Vendor</TableHead>}
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  {!isVendor && <TableCell><Skeleton className="h-5 w-40" /></TableCell>}
                  <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : quotations?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isVendor ? 6 : 7} className="text-center py-8 text-muted-foreground">
                  No quotations found
                </TableCell>
              </TableRow>
            ) : (
              quotations?.map((q) => (
                <TableRow key={q.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="font-medium text-foreground">RFQ #{q.rfqId}</div>
                  </TableCell>
                  {!isVendor && (
                    <TableCell>
                      <div className="font-medium text-foreground">{q.vendorName}</div>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="font-semibold">${q.totalAmount.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{q.deliveryTimeline}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-medium ${getStatusColor(q.status)}`}>
                      {q.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{format(new Date(q.submittedAt), "MMM d, yyyy")}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/quotations/${q.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
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
