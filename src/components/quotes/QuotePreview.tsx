import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface QuoteItem {
  title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface QuotePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  quoteNumber?: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil?: Date;
  notes?: string;
}

export function QuotePreview({
  open,
  onOpenChange,
  customerName,
  quoteNumber = "QT-XXXXXXXX-XXXX",
  items,
  subtotal,
  discount,
  tax,
  total,
  validUntil,
  notes,
}: QuotePreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>תצוגה מקדימה של ההצעה</span>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white rounded-lg border shadow-sm" dir="rtl">
          {/* Header */}
          <div className="bg-[#1a1a2e] text-white p-6 text-center rounded-t-lg">
            <h1 className="text-2xl font-bold m-0">הצעת מחיר</h1>
            <p className="mt-2 opacity-90">{quoteNumber}</p>
          </div>

          {/* Content */}
          <div className="bg-gray-50 p-6">
            <p className="mb-4">שלום {customerName},</p>
            <p className="mb-4">תודה על פנייתך! מצורפת הצעת המחיר שלך:</p>

            {/* Items Table */}
            <table className="w-full border-collapse bg-white my-5 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-right font-medium">פריט</th>
                  <th className="p-3 text-center font-medium">כמות</th>
                  <th className="p-3 text-right font-medium">מחיר ליחידה</th>
                  <th className="p-3 text-right font-medium">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-3">{item.title}</td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">₪{item.unit_price.toFixed(2)}</td>
                    <td className="p-3 text-right">₪{item.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="bg-white p-4 rounded-lg">
              <div className="flex justify-between py-2 text-sm">
                <span>סכום ביניים:</span>
                <span>₪{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between py-2 text-sm text-green-600">
                  <span>הנחה:</span>
                  <span>-₪{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-sm">
                <span>מע"מ (17%):</span>
                <span>₪{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 text-lg font-bold border-t-2 border-gray-200 mt-2">
                <span>סה"כ לתשלום:</span>
                <span>₪{total.toFixed(2)}</span>
              </div>
            </div>

            {validUntil && (
              <p className="text-gray-500 mt-5 text-sm">
                הצעה זו בתוקף עד: {validUntil.toLocaleDateString("he-IL")}
              </p>
            )}

            {notes && (
              <div className="bg-amber-50 p-4 rounded-lg mt-5 text-sm">
                <strong>הערות:</strong>
                <br />
                {notes}
              </div>
            )}

            <p className="mt-8">לאישור ההצעה או לשאלות נוספות, אנא צרו קשר.</p>
          </div>

          {/* Footer */}
          <div className="text-center p-5 text-gray-500 text-sm">
            <p>הצעה זו הופקה אוטומטית ממערכת ה-CRM</p>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
