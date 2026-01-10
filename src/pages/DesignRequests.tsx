import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Palette, 
  Upload, 
  Loader2, 
  CheckCircle, 
  Clock, 
  Play,
  Eye,
  Package
} from "lucide-react";

interface DesignRequest {
  id: string;
  quote_id: string;
  quote_item_id: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  designer_id: string | null;
  design_file_url: string | null;
  design_notes: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  quote_item?: {
    title: string;
    dimensions: string | null;
    product_type: string | null;
    image_url: string | null;
    custom_design_notes: string | null;
  };
  quote?: {
    quote_number: string;
    customer_name: string;
    customer_phone: string | null;
  };
}

const statusConfig = {
  pending: { label: "ממתין", color: "bg-yellow-500", icon: Clock },
  in_progress: { label: "בעבודה", color: "bg-blue-500", icon: Play },
  completed: { label: "הושלם", color: "bg-green-500", icon: CheckCircle },
  cancelled: { label: "בוטל", color: "bg-gray-500", icon: Clock },
};

export default function DesignRequests() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<DesignRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [designNotes, setDesignNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["design-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_requests")
        .select(`
          *,
          quote_item:quote_items(title, dimensions, product_type, image_url, custom_design_notes),
          quote:quotes(quote_number, customer_name, customer_phone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as DesignRequest[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      design_file_url, 
      design_notes 
    }: { 
      id: string; 
      status?: string; 
      design_file_url?: string;
      design_notes?: string;
    }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (design_file_url) updates.design_file_url = design_file_url;
      if (design_notes !== undefined) updates.design_notes = design_notes;
      if (status === "completed") updates.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from("design_requests")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-requests"] });
      toast.success("הבקשה עודכנה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון: " + error.message);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !selectedRequest) return;

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedRequest.id}-${Date.now()}.${fileExt}`;

    setUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from("designs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("designs")
        .getPublicUrl(fileName);

      await updateMutation.mutateAsync({
        id: selectedRequest.id,
        design_file_url: publicUrl,
        status: "completed",
        design_notes: designNotes,
      });

      setDialogOpen(false);
      setSelectedRequest(null);
      setDesignNotes("");
    } catch (error: any) {
      toast.error("שגיאה בהעלאת הקובץ: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const openDesignDialog = (request: DesignRequest) => {
    setSelectedRequest(request);
    setDesignNotes(request.design_notes || "");
    setDialogOpen(true);
  };

  const startWork = (request: DesignRequest) => {
    updateMutation.mutate({ id: request.id, status: "in_progress" });
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const inProgressRequests = requests.filter(r => r.status === "in_progress");
  const completedRequests = requests.filter(r => r.status === "completed");

  const renderRequestCard = (request: DesignRequest) => {
    const StatusIcon = statusConfig[request.status].icon;
    
    return (
      <Card key={request.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              {request.quote_item?.image_url ? (
                <img
                  src={request.quote_item.image_url}
                  alt={request.quote_item?.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-medium truncate">{request.quote_item?.title}</h4>
                <Badge className={statusConfig[request.status].color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig[request.status].label}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                הצעה: {request.quote?.quote_number} | לקוח: {request.quote?.customer_name}
              </p>

              {request.quote_item?.dimensions && (
                <p className="text-sm text-muted-foreground">
                  מידות: {request.quote_item.dimensions}
                </p>
              )}

              {request.quote_item?.custom_design_notes && (
                <p className="text-sm mt-2 p-2 bg-muted rounded">
                  <strong>הערות:</strong> {request.quote_item.custom_design_notes}
                </p>
              )}

              <div className="flex gap-2 mt-3">
                {request.status === "pending" && (
                  <Button size="sm" onClick={() => startWork(request)}>
                    <Play className="h-3 w-3 mr-1" />
                    התחל עבודה
                  </Button>
                )}

                {request.status === "in_progress" && (
                  <Button size="sm" onClick={() => openDesignDialog(request)}>
                    <Upload className="h-3 w-3 mr-1" />
                    העלה עיצוב
                  </Button>
                )}

                {request.status === "completed" && request.design_file_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={request.design_file_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-3 w-3 mr-1" />
                      צפה בעיצוב
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">עיצובים מותאמים</h1>
            <p className="text-muted-foreground">ניהול בקשות לעיצוב אישי</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">אין בקשות לעיצוב</h3>
            <p className="text-muted-foreground mt-1">
              בקשות לעיצוב מותאם אישית יופיעו כאן לאחר אישור הצעות מחיר
            </p>
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending">
                ממתינים ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                בעבודה ({inProgressRequests.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                הושלמו ({completedRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              <div className="grid gap-4">
                {pendingRequests.map(renderRequestCard)}
                {pendingRequests.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">אין בקשות ממתינות</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="in_progress" className="mt-4">
              <div className="grid gap-4">
                {inProgressRequests.map(renderRequestCard)}
                {inProgressRequests.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">אין בקשות בעבודה</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              <div className="grid gap-4">
                {completedRequests.map(renderRequestCard)}
                {completedRequests.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">אין בקשות שהושלמו</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>העלאת עיצוב מותאם</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {selectedRequest && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedRequest.quote_item?.title}</p>
                  {selectedRequest.quote_item?.dimensions && (
                    <p className="text-sm text-muted-foreground">
                      מידות: {selectedRequest.quote_item.dimensions}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label>הערות על העיצוב</Label>
                <Textarea
                  value={designNotes}
                  onChange={(e) => setDesignNotes(e.target.value)}
                  placeholder="פרטים נוספים על העיצוב..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>קובץ עיצוב</Label>
                <div className="mt-1">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      מעלה קובץ...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
