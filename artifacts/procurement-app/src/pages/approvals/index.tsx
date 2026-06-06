import { useState } from "react";
import { Link } from "wouter";
import { CheckSquare, Search, Filter, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useListApprovals, useApproveRequest, useRejectRequest, getListApprovalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ApprovalsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: approvals, isLoading } = useListApprovals({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  
  const [selectedApproval, setSelectedApproval] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState("");

  const handleAction = () => {
    if (!selectedApproval || !actionType) return;
    
    const mutation = actionType === 'approve' ? approveRequest : rejectRequest;
    
    mutation.mutate(
      { id: selectedApproval, data: { remarks } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListApprovalsQueryKey() });
          toast({
            title: `Request ${actionType === 'approve' ? 'Approved' : 'Rejected'}`,
            description: "The approval workflow has been updated.",
          });
          setSelectedApproval(null);
          setActionType(null);
          setRemarks("");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to ${actionType} request.`,
          });
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-600/10 text-amber-600 border-amber-600/20';
      case 'approved': return 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Approval Queue</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and action pending requests</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Request Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : approvals?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No approval requests found
                </TableCell>
              </TableRow>
            ) : (
              approvals?.map((approval) => (
                <TableRow key={approval.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="font-medium text-foreground">{approval.entityTitle}</div>
                    {approval.remarks && approval.status !== 'pending' && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                        "{approval.remarks}"
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs capitalize">
                      {approval.entityType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{approval.requestedByName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{format(new Date(approval.requestedAt), "MMM d, yyyy")}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-medium ${getStatusColor(approval.status)}`}>
                      {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {approval.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                          onClick={() => { setSelectedApproval(approval.id); setActionType('reject'); }}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => { setSelectedApproval(approval.id); setActionType('approve'); }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Actioned {approval.actionedAt ? format(new Date(approval.actionedAt), "MMM d") : ""}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedApproval} onOpenChange={(open) => !open && setSelectedApproval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              Provide optional remarks for this decision. These will be visible in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Enter remarks..." 
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApproval(null)}>Cancel</Button>
            <Button 
              variant={actionType === 'reject' ? "destructive" : "default"}
              onClick={handleAction}
              disabled={approveRequest.isPending || rejectRequest.isPending}
            >
              Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
