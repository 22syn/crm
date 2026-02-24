import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QuoteItem {
  title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  dimensions?: string;
  product_type?: string;
}

export interface QuoteContactInfo {
  whatsapp?: string;
  instagram?: string;
  email?: string;
}

interface QuotePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  customerAddress?: string;
  quoteNumber?: string;
  quoteDate?: string | Date;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil?: Date;
  notes?: string;
  paymentTerms?: string;
  companyName?: string;
  contactInfo?: QuoteContactInfo;
}

/** Design tokens — clean business document style */
const tokens = {
  bg: "#FFFFFF",
  text: "#1a1a1a",
  textMuted: "#525252",
  stroke: "#e5e5e5",
  accent: "#2563eb",
  fontFamily: "'Heebo', 'Segoe UI', sans-serif",
};

function formatPrice(n: number) {
  return `₪${n.toFixed(2)}`;
}

function formatDate(d: string | Date) {
  return typeof d === "string" ? d : new Date(d).toLocaleDateString("he-IL");
}

export function QuotePreview({
  open,
  onOpenChange,
  customerName,
  customerAddress,
  quoteNumber = "CT-XXXXXXXX-XXXX",
  quoteDate,
  items,
  subtotal,
  discount,
  tax,
  total,
  validUntil,
  notes,
  paymentTerms,
  companyName = "הר סיני הפקות",
  contactInfo,
}: QuotePreviewProps) {
  const headerSubline = [quoteNumber, quoteDate ? formatDate(quoteDate) : null]
    .filter(Boolean)
    .join(" / ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[760px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>תצוגה מקדימה של ההצעה</span>
          </DialogTitle>
        </DialogHeader>

        <div
          className="rounded-lg overflow-hidden"
          dir="rtl"
          style={{
            backgroundColor: tokens.bg,
            color: tokens.text,
            fontFamily: tokens.fontFamily,
            maxWidth: 720,
            margin: "0 auto",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          {/* Document container: 680–760px, padding 28–36px */}
          <div className="px-7 py-7" style={{ padding: "28px 36px" }}>
            {/* Header */}
            <header className="flex items-start justify-between gap-6 pb-6" style={{ borderBottom: `2px solid ${tokens.stroke}` }}>
              <div className="text-start">
                <p className="text-sm font-medium" style={{ color: tokens.textMuted, marginBottom: 4 }}>
                  {companyName}
                </p>
                <h1 style={{ fontSize: "22px", fontWeight: 600, color: tokens.text, letterSpacing: "-0.02em" }}>
                  הצעת מחיר
                </h1>
                {headerSubline && (
                  <p style={{ fontSize: "12px", lineHeight: 1.5, marginTop: 6, color: tokens.textMuted }}>
                    {headerSubline}
                  </p>
                )}
              </div>
            </header>

            {/* תכולת עבודה. - intro + client */}
            <section style={{ marginBottom: 24 }}>
              <h2
                className="font-medium"
                style={{ fontSize: "14px", fontWeight: 600, color: tokens.text, marginBottom: 12 }}
              >
                תכולת עבודה
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: tokens.textMuted,
                }}
              >
                {customerName}
                {customerAddress ? ` · ${customerAddress}` : ""}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: tokens.textMuted,
                  marginTop: 8,
                }}
              >
                מצורפת הצעת המחיר להמשך.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: tokens.stroke, marginBottom: 24 }} />

            {/* תמחור. - pricing table */}
            <section style={{ marginBottom: 24 }}>
              <h2
                className="font-medium"
                style={{ fontSize: "14px", fontWeight: 600, color: tokens.text, marginBottom: 16 }}
              >
                תמחור
              </h2>
              <table className="w-full border-collapse" style={{ fontSize: "13px" }}>
                <thead>
                  <tr>
                    <th
                      className="text-end font-medium py-3 pe-3 ps-2"
                      style={{ color: tokens.text, fontSize: "12px" }}
                    >
                      פריט
                    </th>
                    <th
                      className="text-center font-medium py-3 px-2"
                      style={{ color: tokens.text, fontSize: "12px" }}
                    >
                      כמות
                    </th>
                    <th
                      className="text-end font-medium py-3 px-2"
                      style={{ color: tokens.text, fontSize: "12px" }}
                    >
                      מחיר ליחידה
                    </th>
                    <th
                      className="text-end font-medium py-3 px-2"
                      style={{ color: tokens.text, fontSize: "12px" }}
                    >
                      סה״כ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td
                        className="py-3 pe-3 ps-2 border-t"
                        style={{
                          borderColor: tokens.stroke,
                          color: tokens.textMuted,
                          lineHeight: 1.6,
                        }}
                      >
                        <span>{item.title}</span>
                        {(item.product_type || item.dimensions) && (
                          <span className="block text-[10px] mt-0.5 opacity-80">
                            {[item.product_type, item.dimensions].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </td>
                      <td
                        className="py-3 px-2 border-t text-center"
                        style={{ borderColor: tokens.stroke, color: tokens.textMuted }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        className="py-3 px-2 border-t text-end font-medium"
                        style={{
                          borderColor: tokens.stroke,
                          color: tokens.text,
                          fontSize: "12px",
                        }}
                      >
                        <span dir="ltr">{formatPrice(item.unit_price)}</span>
                      </td>
                      <td
                        className="py-3 px-2 border-t text-end font-medium"
                        style={{
                          borderColor: tokens.stroke,
                          color: tokens.text,
                          fontSize: "12px",
                        }}
                      >
                        <span dir="ltr">{formatPrice(item.total_price)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary row - divider + סה״כ לתשלום. */}
              <div
                className="flex justify-between items-center py-3 mt-2 font-medium"
                style={{
                  borderTop: `1px solid ${tokens.stroke}`,
                  fontSize: "12px",
                  color: tokens.text,
                }}
              >
                <span>סה״כ לתשלום.</span>
                <span dir="ltr">{formatPrice(total)}</span>
              </div>
              {discount > 0 && (
                <div
                  className="flex justify-between py-1 text-[11px]"
                  style={{ color: tokens.textMuted }}
                >
                  <span>הנחה</span>
                  <span dir="ltr">-{formatPrice(discount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div
                  className="flex justify-between py-1 text-[11px]"
                  style={{ color: tokens.textMuted }}
                >
                  <span>מע״מ (17%)</span>
                  <span dir="ltr">{formatPrice(tax)}</span>
                </div>
              )}
            </section>

            {(paymentTerms || validUntil || notes) && (
              <>
                <div style={{ height: 1, backgroundColor: tokens.stroke, marginBottom: 24 }} />
                <section style={{ marginBottom: 24 }}>
                  <h2
                    className="font-medium"
                    style={{ fontSize: "14px", fontWeight: 600, color: tokens.text, marginBottom: 12 }}
                  >
                    תנאים
                  </h2>
                  <div
                    style={{
                      fontSize: "13px",
                      lineHeight: 1.8,
                      color: tokens.textMuted,
                    }}
                  >
                    {paymentTerms && <p>{paymentTerms}</p>}
                    {validUntil && (
                      <p style={{ marginTop: paymentTerms ? 8 : 0 }}>
                        תוקף עד: {validUntil.toLocaleDateString("he-IL")}
                      </p>
                    )}
                    {notes && (
                      <p style={{ marginTop: (paymentTerms || validUntil) ? 8 : 0 }}>{notes}</p>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* יצירת קשר. - footer */}
            <div style={{ height: 1, backgroundColor: tokens.stroke, marginBottom: 24 }} />
            <footer>
              <h2
                className="font-medium"
                style={{ fontSize: "14px", fontWeight: 600, color: tokens.text, marginBottom: 12 }}
              >
                יצירת קשר
              </h2>
              <ul
                className="list-none p-0 m-0 space-y-1"
                style={{
                  fontSize: "11px",
                  lineHeight: 1.6,
                  color: tokens.textMuted,
                }}
              >
                {contactInfo?.whatsapp && (
                  <li>
                    <a
                      href={contactInfo.whatsapp.startsWith("http") ? contactInfo.whatsapp : `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: tokens.text }}
                    >
                      WhatsApp
                    </a>
                  </li>
                )}
                {contactInfo?.instagram && (
                  <li>
                    <a
                      href={contactInfo.instagram.startsWith("http") ? contactInfo.instagram : `https://instagram.com/${contactInfo.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: tokens.text }}
                    >
                      Instagram
                    </a>
                  </li>
                )}
                {contactInfo?.email && (
                  <li>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: tokens.text }}
                    >
                      {contactInfo.email}
                    </a>
                  </li>
                )}
                {(!contactInfo?.whatsapp && !contactInfo?.instagram && !contactInfo?.email) && (
                  <li>{companyName}</li>
                )}
              </ul>
            </footer>
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
