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
  dimensions?: string;
  product_type?: string;
}

interface QuotePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  customerAddress?: string;
  quoteNumber?: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil?: Date;
  notes?: string;
  paymentTerms?: string;
}

export function QuotePreview({
  open,
  onOpenChange,
  customerName,
  customerAddress,
  quoteNumber = "CT-XXXXXXXX-XXXX",
  items,
  subtotal,
  discount,
  tax,
  total,
  validUntil,
  notes,
  paymentTerms,
}: QuotePreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>תצוגה מקדימה של ההצעה</span>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-[#f8f6f3] rounded-lg border border-[#e8e4de] shadow-sm" dir="rtl">
          {/* Header - Demo Style */}
          <div className="bg-[#3d3830] text-[#f8f6f3] p-8 text-center rounded-t-lg">
            <div className="mb-4">
              <h2 className="text-3xl font-bold tracking-tight">Demo CRM</h2>
              <span className="text-[10px] tracking-[0.2em] opacity-70 uppercase">Premium Furniture Management</span>
            </div>
            <div className="w-16 h-[1px] bg-[#c4b8a8] mx-auto my-4"></div>
            <h1 className="text-xl font-light tracking-wide">הצעת מחיר</h1>
            <p className="mt-2 text-sm opacity-80 font-light">{quoteNumber}</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <p className="mb-2 text-[#5a5347]">שלום {customerName},</p>
            {customerAddress && (
              <p className="mb-2 text-[#5a5347] text-sm">{customerAddress}</p>
            )}
            <p className="mb-6 text-[#5a5347]">תודה על פנייתך! מצורפת הצעת המחיר שלך:</p>

            {/* Items Table */}
            <table className="w-full border-collapse my-6 text-sm">
              <thead>
                <tr className="border-b-2 border-[#c4b8a8]">
                  <th className="p-3 text-right font-medium text-[#3d3830]">פריט</th>
                  <th className="p-3 text-right font-medium text-[#3d3830]">מידות</th>
                  <th className="p-3 text-center font-medium text-[#3d3830]">כמות</th>
                  <th className="p-3 text-right font-medium text-[#3d3830]">מחיר ליחידה</th>
                  <th className="p-3 text-right font-medium text-[#3d3830]">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-[#e8e4de]">
                    <td className="p-3 text-[#5a5347]">
                      <div>{item.title}</div>
                      {item.product_type && (
                        <div className="text-xs text-[#8a8279]">{item.product_type}</div>
                      )}
                    </td>
                    <td className="p-3 text-[#5a5347] text-sm">{item.dimensions || "-"}</td>
                    <td className="p-3 text-center text-[#5a5347]">{item.quantity}</td>
                    <td className="p-3 text-right text-[#5a5347]">₪{item.unit_price.toFixed(2)}</td>
                    <td className="p-3 text-right text-[#5a5347]">₪{item.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="bg-white/50 p-5 rounded border border-[#e8e4de]">
              <div className="flex justify-between py-2 text-sm text-[#5a5347]">
                <span>סכום ביניים:</span>
                <span>₪{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between py-2 text-sm text-[#6b8e6b]">
                  <span>הנחה:</span>
                  <span>-₪{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-sm text-[#5a5347]">
                <span>מע"מ (17%):</span>
                <span>₪{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 text-lg font-medium text-[#3d3830] border-t-2 border-[#c4b8a8] mt-2">
                <span>סה"כ לתשלום:</span>
                <span>₪{total.toFixed(2)}</span>
              </div>
            </div>

            {paymentTerms && (
              <p className="text-[#5a5347] mt-4 text-sm">
                <strong className="text-[#3d3830]">תנאי תשלום:</strong> {paymentTerms}
              </p>
            )}

            {validUntil && (
              <p className="text-[#8a8279] mt-6 text-sm">
                הצעה זו בתוקף עד: {validUntil.toLocaleDateString("he-IL")}
              </p>
            )}

            {notes && (
              <div className="bg-[#f0ebe3] p-4 rounded border border-[#e0d9ce] mt-6 text-sm text-[#5a5347]">
                <strong className="text-[#3d3830]">הערות:</strong>
                <br />
                {notes}
              </div>
            )}

            <p className="mt-8 text-[#5a5347]">לאישור ההצעה או לשאלות נוספות, אנא צרו קשר.</p>
          </div>

          {/* Footer */}
          <div className="text-center p-6 border-t border-[#e8e4de] text-[#8a8279] text-sm">
            <p className="font-light">Because ordinary isn't an option</p>
            <p className="mt-2 text-xs">democrm.com</p>
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
