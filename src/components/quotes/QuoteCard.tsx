import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Mail, 
  MessageCircle, 
  CheckCircle, 
  Clock,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

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
}

interface QuoteCardProps {
  quote: Quote;
  onConvertToOrder?: (quote: Quote) => void;
  onResend?: (quote: Quote) => void;
  onView?: (quote: Quote) => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "טיוטה", variant: "outline" },
  sent: { label: "נשלח", variant: "secondary" },
  approved: { label: "אושר", variant: "default" },
  rejected: { label: "נדחה", variant: "destructive" },
  expired: { label: "פג תוקף", variant: "outline" },
};

export function QuoteCard({ quote, onConvertToOrder, onResend, onView }: QuoteCardProps) {
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
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="font-medium">{quote.customer_name}</p>
          <p className="text-2xl font-bold">₪{quote.total.toFixed(2)}</p>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {format(new Date(quote.created_at), "dd MMM yyyy", { locale: he })}
            </span>
            {quote.valid_until && (
              <>
                <span className="mx-1">•</span>
                <span>תקף עד {format(new Date(quote.valid_until), "dd/MM/yy")}</span>
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
              צפייה
            </Button>

            {quote.status === "sent" && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onConvertToOrder?.(quote)}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                אשר והמר להזמנה
              </Button>
            )}
            
            {quote.customer_email && quote.status !== "approved" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResend?.(quote)}
              >
                <Mail className="h-3 w-3 mr-1" />
                שלח שוב
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
