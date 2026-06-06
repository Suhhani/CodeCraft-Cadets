import { useState } from "react";
import { CheckCircle2, Clock, FileText, Package, Users, CheckSquare, Activity } from "lucide-react";
import { useListActivityLogs } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type FilterType = "all" | "rfq" | "approval" | "invoice" | "vendor" | "purchase_order" | "quotation";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "RFQ", value: "rfq" },
  { label: "Approvals", value: "approval" },
  { label: "Invoices", value: "invoice" },
  { label: "Vendors", value: "vendor" },
];

function getEntityIcon(type: string) {
  switch (type) {
    case "rfq": return <FileText className="h-4 w-4" />;
    case "quotation": return <FileText className="h-4 w-4" />;
    case "purchase_order": return <Package className="h-4 w-4" />;
    case "invoice": return <FileText className="h-4 w-4" />;
    case "vendor": return <Users className="h-4 w-4" />;
    case "approval": return <CheckSquare className="h-4 w-4" />;
    default: return <Activity className="h-4 w-4" />;
  }
}

function getEntityStyle(type: string) {
  switch (type) {
    case "rfq": return "bg-blue-50 text-blue-600";
    case "quotation": return "bg-purple-50 text-purple-600";
    case "purchase_order": return "bg-emerald-50 text-emerald-600";
    case "invoice": return "bg-amber-50 text-amber-600";
    case "vendor": return "bg-indigo-50 text-indigo-600";
    case "approval": return "bg-rose-50 text-rose-600";
    default: return "bg-muted text-muted-foreground";
  }
}

function getStatusIcon(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("approved") || lower.includes("selected") || lower.includes("generated") || lower.includes("added")) {
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  }
  if (lower.includes("pending") || lower.includes("submitted") || lower.includes("published")) {
    return <Clock className="h-5 w-5 text-amber-500" />;
  }
  return <Activity className="h-5 w-5 text-blue-500" />;
}

export function ActivityLogsPage() {
  const { data: logs, isLoading } = useListActivityLogs({ limit: 100 });
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filtered = logs?.filter((log) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "approval") return log.entityType === "approval";
    return log.entityType === activeFilter;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Activity & Logs</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Procurement audit trail</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant="outline"
            size="sm"
            onClick={() => setActiveFilter(f.value)}
            className={`rounded-full px-4 font-medium transition-colors ${
              activeFilter === f.value
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="space-y-0 divide-y border rounded-lg bg-card overflow-hidden">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))
        ) : filtered?.length === 0 ? (
          <div className="py-14 text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            No activity logs found
          </div>
        ) : (
          filtered?.map((log) => (
            <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/20 transition-colors">
              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${getEntityStyle(log.entityType)}`}>
                {getEntityIcon(log.entityType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">{getStatusIcon(log.action)}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-snug">
                        <span className="font-semibold">{log.action}</span>
                        {log.description ? ` — ${log.description}` : ""}
                        {log.entityTitle ? (
                          <span className="font-semibold"> {log.entityTitle}</span>
                        ) : null}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.createdAt), "d MMM yyyy, hh:mm aa")}
                        </span>
                        {log.userName && (
                          <>
                            <span className="text-muted-foreground/40 text-xs">·</span>
                            <span className="text-xs text-muted-foreground">{log.userName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
