import { useState } from "react";
import { CheckCircle2, XCircle, Clock, ArrowLeft, CheckSquare } from "lucide-react";
import { useListApprovals, useApproveRequest, useRejectRequest, getListApprovalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type Approval = {
  id: number;
  entityType: string;
  entityTitle: string;
  status: string;
  requestedByName: string | null;
  requestedAt: string;
  actionedAt?: string | null;
  remarks?: string | null;
  approvedByName?: string | null;
};

function getWorkflowStep(status: string) {
  switch (status) {
    case "pending": return 2;
    case "approved": return 4;
    case "rejected": return 2;
    default: return 1;
  }
}

const STEPS = [
  { label: "Submitted" },
  { label: "L1 Review" },
  { label: "L2 Approval" },
  { label: "Generate PO" },
];

function WorkflowSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors
                  ${isActive ? "border-amber-500 bg-amber-50 text-amber-600" : isDone ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-gray-300 bg-white text-gray-400"}`}
              >
                {stepNum}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap font-medium ${isActive ? "text-amber-600" : isDone ? "text-emerald-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-16 sm:w-24 mx-1 mb-5 transition-colors ${isDone ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ApprovalDetail({
  approval,
  onBack,
}: {
  approval: Approval;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const [remarks, setRemarks] = useState(approval.remarks ?? "");

  const handleAction = (type: "approve" | "reject") => {
    const mutation = type === "approve" ? approveRequest : rejectRequest;
    mutation.mutate(
      { id: approval.id, data: { remarks } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListApprovalsQueryKey() });
          toast({
            title: type === "approve" ? "Request Approved" : "Request Rejected",
            description: "The approval workflow has been updated.",
          });
          onBack();
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: `Failed to ${type} request.` });
        },
      }
    );
  };

  const currentStep = getWorkflowStep(approval.status);

  const approvalChain = [
    {
      name: approval.approvedByName ?? "Procurement Head",
      role: "Procurement Head",
      status: approval.status === "pending" ? "approved" : approval.status === "approved" ? "approved" : "rejected",
      date: approval.actionedAt ?? approval.requestedAt,
    },
    {
      name: "Finance Manager",
      role: "Finance Manager",
      status: approval.status === "pending" ? "awaiting" : approval.status === "approved" ? "approved" : "rejected",
      date: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Approval Workflow</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {approval.entityTitle} — {approval.requestedByName}
        </p>
      </div>

      <WorkflowSteps currentStep={currentStep} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Approval Chain</h3>
            <div className="space-y-3">
              {approvalChain.map((member, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    ${member.status === "approved" ? "bg-emerald-50 text-emerald-500" : member.status === "rejected" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"}`}>
                    {member.status === "approved" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : member.status === "rejected" ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-foreground">{member.name} <span className="text-muted-foreground font-normal">({member.role})</span></div>
                    {member.status === "approved" && member.date && (
                      <div className="text-xs text-emerald-600 mt-0.5">Approved on {format(new Date(member.date), "MMM d, h:mm aa")}</div>
                    )}
                    {member.status === "awaiting" && (
                      <div className="text-xs text-amber-600 mt-0.5">Awaiting · Assigned {format(new Date(approval.requestedAt), "MMM d")}</div>
                    )}
                    {member.status === "rejected" && member.date && (
                      <div className="text-xs text-red-500 mt-0.5">Rejected on {format(new Date(member.date), "MMM d, h:mm aa")}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {approval.status === "pending" && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Approval Remarks</h3>
              <Textarea
                placeholder="Add your comments or conditions…"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="resize-none h-28 text-sm"
              />
            </div>
          )}

          {approval.status !== "pending" && approval.remarks && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Remarks</h3>
              <p className="text-sm italic text-muted-foreground border rounded-md p-3 bg-muted/40">"{approval.remarks}"</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Request Summary</h3>
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="divide-y">
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">Request</span>
                <span className="text-sm font-medium text-right max-w-[60%] truncate">{approval.entityTitle}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="secondary" className="capitalize font-mono text-xs">
                  {approval.entityType.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">Requested by</span>
                <span className="text-sm font-medium">{approval.requestedByName ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">Submitted</span>
                <span className="text-sm font-medium">{format(new Date(approval.requestedAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={`font-medium capitalize ${
                    approval.status === "pending"
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : approval.status === "approved"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-red-50 text-red-600 border-red-200"
                  }`}
                >
                  {approval.status}
                </Badge>
              </div>
            </div>

            {approval.status === "pending" && (
              <div className="flex gap-3 p-4 border-t bg-muted/30">
                <Button
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleAction("reject")}
                  disabled={rejectRequest.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1.5" /> Reject
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleAction("approve")}
                  disabled={approveRequest.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApprovalsList() {
  const { data: approvals, isLoading } = useListApprovals({});
  const [selected, setSelected] = useState<Approval | null>(null);

  if (selected) {
    return <ApprovalDetail approval={selected} onBack={() => setSelected(null)} />;
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-50 text-amber-600 border-amber-200";
      case "approved": return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "rejected": return "bg-red-50 text-red-600 border-red-200";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Approval Workflow</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and action pending approval requests</p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <Skeleton className="h-5 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))
        ) : approvals?.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
            <CheckSquare className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            No approval requests found
          </div>
        ) : (
          approvals?.map((approval) => {
            const step = getWorkflowStep(approval.status);
            return (
              <button
                key={approval.id}
                onClick={() => setSelected(approval as Approval)}
                className="w-full text-left rounded-lg border bg-card hover:bg-muted/30 hover:border-primary/30 transition-all p-4 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{approval.entityTitle}</div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <Badge variant="secondary" className="font-mono text-xs capitalize">
                        {approval.entityType.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Requested by <span className="font-medium text-foreground">{approval.requestedByName}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(approval.requestedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                      Step {step} of {STEPS.length}
                    </div>
                    <Badge variant="outline" className={`font-medium capitalize ${getStatusStyle(approval.status)}`}>
                      {approval.status}
                    </Badge>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">›</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-0">
                  {STEPS.map((s, i) => {
                    const num = i + 1;
                    const isActive = num === step;
                    const isDone = num < step;
                    return (
                      <div key={s.label} className="flex items-center">
                        <div className={`w-2 h-2 rounded-full transition-colors
                          ${isActive ? "bg-amber-500" : isDone ? "bg-emerald-400" : "bg-gray-200"}`} />
                        {i < STEPS.length - 1 && (
                          <div className={`h-0.5 w-8 transition-colors ${isDone ? "bg-emerald-300" : "bg-gray-200"}`} />
                        )}
                      </div>
                    );
                  })}
                  <span className="ml-3 text-xs text-muted-foreground">{STEPS[step - 1]?.label}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
