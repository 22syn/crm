import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Mail, 
  MessageCircle, 
  CheckCircle, 
  Clock,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  total: number;
  valid_until: string | null;
  created_at: string;
  lead_id?: string | null;
}

interface QuoteCardProps {
  quote: Quote;
  onConvertToOrder?: (quote: Quote) => void;
  onResend?: (quote: Quote) => void;
  onView?: (quote: Quote) => void;
  onEdit?: (quote: Quote) => void;
  onDelete?: (quote: Quote) => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "outline" },
  sent: { label: "Sent", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "outline" },
};

export function QuoteCard({ quote, onConvertToOrder, onResend, onView, onEdit, onDelete }: QuoteCardProps) {
  const status = statusConfig[quote.status] || statusConfig.draft;
  
  const getWhatsAppLink = () => {
    if (!quote.customer_phone) return "";
    const phone = quote.customer_phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `שלום ${quote.customer_name}, לגבי הצעת המחיר ${quote.quote_number} בסך ₪${quote.total.toFixed(2)} - האם תרצו להמשיך?`
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm">{quote.quote_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(quote)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                {quote.status === "draft" && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(quote)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(quote)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="font-medium">{quote.customer_name}</p>
          <p className="text-2xl font-bold">₪{quote.total.toFixed(2)}</p>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {format(new Date(quote.created_at), "dd MMM yyyy")}
            </span>
            {quote.valid_until && (
              <>
                <span className="mx-1">•</span>
                <span>Valid until {format(new Date(quote.valid_until), "dd/MM/yy")}</span>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-3 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView?.(quote)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>

            {quote.status === "sent" && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onConvertToOrder?.(quote)}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve
              </Button>
            )}
            
            {quote.customer_email && quote.status !== "approved" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResend?.(quote)}
              >
                <Mail className="h-3 w-3 mr-1" />
                Resend
              </Button>
            )}
            
            {quote.customer_phone && (
              <Button size="sm" variant="ghost" asChild>
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
