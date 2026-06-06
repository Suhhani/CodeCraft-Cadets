import { useState } from "react";
import { Activity, Clock } from "lucide-react";
import { useListActivityLogs } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function ActivityLogsPage() {
  const { data: logs, isLoading } = useListActivityLogs({ limit: 100 });

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'rfq': return 'bg-blue-600/10 text-blue-600';
      case 'quotation': return 'bg-purple-600/10 text-purple-600';
      case 'purchase_order': return 'bg-emerald-600/10 text-emerald-600';
      case 'invoice': return 'bg-amber-600/10 text-amber-600';
      case 'vendor': return 'bg-indigo-600/10 text-indigo-600';
      case 'approval': return 'bg-rose-600/10 text-rose-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Audit Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">Chronological record of all platform activities</p>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-48">Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                </TableRow>
              ))
            ) : logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No activity logs found
                </TableCell>
              </TableRow>
            ) : (
              logs?.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Activity className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {log.userName || "System"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-mono text-xs uppercase ${getEntityColor(log.entityType)} border-transparent`}>
                      {log.entityType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-semibold text-foreground">{log.action}: </span>
                    <span className="text-muted-foreground">{log.description}</span>
                    {log.entityTitle && (
                      <span className="ml-2 px-2 py-0.5 bg-muted rounded-md text-xs font-medium">
                        {log.entityTitle}
                      </span>
                    )}
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
