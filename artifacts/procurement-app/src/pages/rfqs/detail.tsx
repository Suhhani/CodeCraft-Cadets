import { useState, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { FileText, ArrowLeft, Clock, Building2, FileCheck, CheckCircle2, Upload, X, Paperclip } from "lucide-react";
import { useGetRfq, useListQuotations, useUpdateRfq, getGetRfqQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export function RfqDetail() {
  const [, params] = useRoute("/rfqs/:id");
  const rfqId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: rfq, isLoading: isRfqLoading } = useGetRfq(rfqId, { query: { enabled: !!rfqId } });
  const { data: quotations, isLoading: isQuotationsLoading } = useListQuotations({ rfqId }, { query: { enabled: !!rfqId } });
  const updateRfq = useUpdateRfq();

  const handleCloseRfq = () => {
    updateRfq.mutate(
      { id: rfqId, data: { status: "closed" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRfqQueryKey(rfqId) });
          toast({ title: "RFQ Closed", description: "Vendors can no longer submit quotations." });
        },
      }
    );
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: AttachedFile[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    toast({ title: `${newFiles.length} file(s) attached`, description: "Files ready to be sent with this RFQ." });
  };

  const removeFile = (id: string) => setAttachedFiles((prev) => prev.filter((f) => f.id !== id));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-50 text-green-700 border-green-200";
      case "closed": return "bg-amber-50 text-amber-700 border-amber-200";
      case "awarded": return "bg-blue-50 text-blue-700 border-blue-200";
      case "cancelled": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  if (isRfqLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-1/3" />
        <Card><CardContent className="h-64 p-6"><Skeleton className="h-full w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!rfq) return <div>RFQ not found</div>;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLocation("/rfqs")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{rfq.title}</h1>
              <Badge variant="outline" className={`text-xs font-medium ${getStatusColor(rfq.status)}`}>
                {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{rfq.rfqNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {rfq.status === "open" && (
            <Button variant="outline" size="sm" onClick={handleCloseRfq} disabled={updateRfq.isPending}>
              Close Bidding
            </Button>
          )}
          {rfq.status === "closed" && (
            <Link href={`/rfqs/${rfqId}/compare`}>
              <Button size="sm" className="gap-1.5">
                <FileCheck className="h-3.5 w-3.5" /> Compare Quotations
              </Button>
            </Link>
          )}
          {rfq.status === "awarded" && (
            <Badge className="h-8 px-3 bg-blue-50 text-blue-700 border-blue-200 font-semibold rounded-md text-xs gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Awarded
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left — Details + Attachments */}
        <div className="md:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">RFQ Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {rfq.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Description</p>
                  <p className="text-sm leading-relaxed">{rfq.description}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Line Items ({rfq.items.length})
                </p>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-xs font-semibold">Item Name</TableHead>
                        <TableHead className="text-xs font-semibold">Description</TableHead>
                        <TableHead className="text-right text-xs font-semibold">Qty</TableHead>
                        <TableHead className="text-xs font-semibold">Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfq.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-sm">{item.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.description || "—"}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{item.quantity}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4" /> Attachments
                {attachedFiles.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{attachedFiles.length}</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">Attach specifications, drawings, or supporting documents</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
                <Upload className={`h-8 w-8 mx-auto mb-3 ${isDragging ? "text-primary" : "text-muted-foreground/50"}`} />
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">or <span className="text-primary font-medium">click to browse</span></p>
                <p className="text-xs text-muted-foreground mt-2">PDF, DOC, XLS, PNG, JPG — up to 25 MB each</p>
              </div>

              {/* Attached files list */}
              {attachedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachedFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-2.5 rounded-md border bg-muted/20 group">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — Schedule + Quotations */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium">{format(new Date(rfq.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Deadline</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-destructive" />
                  {format(new Date(rfq.deadline), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vendors Invited</span>
                <span className="text-sm font-medium">{rfq.assignedVendorIds.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quotations Received</CardTitle>
              <CardDescription className="text-xs">
                {quotations?.length || 0} of {rfq.assignedVendorIds.length} vendors responded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isQuotationsLoading ? (
                <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
              ) : quotations && quotations.length > 0 ? (
                <div className="space-y-2">
                  {quotations.map((q) => (
                    <div key={q.id} className="flex justify-between items-center p-2.5 rounded-md border bg-muted/10">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{q.vendorName}</span>
                      </div>
                      <div className="text-sm font-semibold">
                        ₹{q.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-xs text-muted-foreground border border-dashed rounded-md">
                  No quotations received yet
                </div>
              )}

              {rfq.status === "open" && (
                <Link href={`/quotations/new?rfqId=${rfqId}`}>
                  <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5" /> Submit Quotation
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
