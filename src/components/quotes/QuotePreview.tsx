import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { List, Globe, Mail, Phone } from "lucide-react";

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
  phone?: string;
  website?: string;
}

type Locale = "he" | "en";

interface LocaleStrings {
  previewTitle: string;
  close: string;
  quoteTitle: string;
  billTo: string;
  projectScope: string;
  scopeIntro: string;
  detailedQuote: string;
  itemDesc: string;
  quantity: string;
  unitPrice: string;
  total: string;
  subtotal: string;
  totalToPay: string;
  discount: string;
  vat: string;
  paymentTerms: string;
  validUntil: string;
  approval: string;
  clientSignature: string;
  contact: string;
  priceDisclaimer: string;
}

const strings: Record<Locale, LocaleStrings> = {
  he: {
    previewTitle: "תצוגה מקדימה של ההצעה",
    close: "סגור",
    quoteTitle: "הצעת מחיר",
    billTo: "נמען",
    projectScope: "תכולת עבודה",
    scopeIntro: "מצורפת הצעת המחיר להמשך.",
    detailedQuote: "פירוט תמחור",
    itemDesc: "פריט ותיאור",
    quantity: "כמות",
    unitPrice: "מחיר ליחידה",
    total: "סה״כ",
    subtotal: "סה״כ ביניים",
    totalToPay: "סה״כ לתשלום",
    discount: "הנחה",
    vat: "מע״מ",
    paymentTerms: "תנאי תשלום",
    validUntil: "תוקף עד",
    approval: "אישור",
    clientSignature: "חתימת הלקוח ותאריך",
    contact: "יצירת קשר",
    priceDisclaimer: "המחירים בשקלים חדשים ואינם כוללים הוצאות נוספות.",
  },
  en: {
    previewTitle: "Quote Preview",
    close: "Close",
    quoteTitle: "Quote",
    billTo: "Bill To",
    projectScope: "Project Scope",
    scopeIntro: "Please find the attached quote for your review.",
    detailedQuote: "Detailed Quote",
    itemDesc: "Item & Description",
    quantity: "Qty",
    unitPrice: "Unit Price",
    total: "Total",
    subtotal: "Subtotal",
    totalToPay: "Total",
    discount: "Discount",
    vat: "Tax",
    paymentTerms: "Payment Terms",
    validUntil: "Valid until",
    approval: "Approval",
    clientSignature: "Client Signature & Date",
    contact: "Contact",
    priceDisclaimer: "Prices are in ILS and exclusive of additional expenses.",
  },
};

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
  companyAddress?: string;
  contactInfo?: QuoteContactInfo;
  locale?: Locale;
  showLocaleToggle?: boolean;
}

const primary = "#1337ec";

/** Hadarya database icon from Stitch design */
function HadaryaIcon({ className = "size-10" }: { className?: string }) {
  return (
    <svg
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color: primary }}
    >
      <path
        d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.1288 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z"
        fill="currentColor"
      />
      <path
        clipRule="evenodd"
        d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

function formatPrice(n: number) {
  return `₪${n.toFixed(2)}`;
}

function formatDate(d: string | Date, locale: Locale) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(locale === "he" ? "he-IL" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
  companyAddress,
  contactInfo,
  locale: initialLocale = "he",
  showLocaleToggle = true,
}: QuotePreviewProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const t = strings[locale];
  const isRtl = locale === "he";
  const dateStr = quoteDate ? formatDate(quoteDate, locale) : null;
  const validStr = validUntil ? formatDate(validUntil, locale) : null;

  const defaultTerms =
    locale === "he"
      ? "תשלום לפי תנאי ההצעה. אנא ציינו את מספר ההצעה בהזמנה."
      : "Payment as per quote terms. Please reference this quote number in your purchase order.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[960px] max-h-[90vh] overflow-auto p-6 bg-[#f6f6f8]">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
          <DialogTitle className="text-base font-semibold">
            {t.previewTitle}
          </DialogTitle>
          {showLocaleToggle && (
            <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setLocale("he")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  locale === "he"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                עברית
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  locale === "en"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                English
              </button>
            </div>
          )}
        </DialogHeader>

        {/* Stitch-style document container - matches Stitch Professional Quote Template */}
        <div
          className="w-full max-w-[960px] bg-white shadow-2xl rounded-xl overflow-hidden border border-slate-200 flex flex-col"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {/* Quote Header - two columns */}
          <div className="p-8 md:p-12 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-4">
                <HadaryaIcon />
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {companyName}
                </span>
              </div>
              {companyAddress && (
                <p className="text-slate-500 text-sm max-w-[280px] leading-relaxed">
                  {companyAddress}
                </p>
              )}
              {contactInfo?.email && (
                <p className="text-slate-500 text-sm">{contactInfo.email}</p>
              )}
            </div>
            <div
              className={`flex flex-col gap-2 ${
                isRtl ? "items-start" : "items-end"
              }`}
            >
              <h1
                className="text-4xl md:text-5xl font-black tracking-tighter"
                style={{ color: primary }}
              >
                {t.quoteTitle.toUpperCase()}
              </h1>
              <div className="flex flex-col gap-1 mt-2">
                <p className="text-slate-900 font-bold text-lg">
                  #{quoteNumber}
                </p>
                {dateStr && (
                  <p className="text-slate-500 text-sm">
                    {locale === "he" ? "תאריך:" : "Issued:"} {dateStr}
                  </p>
                )}
                {validStr && (
                  <p className="text-slate-500 text-sm">
                    {t.validUntil}: {validStr}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bill To + Project Scope */}
          <div className="px-8 md:px-12 py-10 grid grid-cols-1 md:grid-cols-2 gap-12 bg-slate-50/50">
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {t.billTo}
              </h3>
              <div className="flex flex-col gap-1">
                <p className="text-slate-900 font-bold text-xl">{customerName}</p>
                {customerAddress && (
                  <p className="text-slate-600 leading-relaxed">
                    {customerAddress}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {t.projectScope}
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {t.scopeIntro}
              </p>
              {notes && (
                <p className="text-slate-600 leading-relaxed text-sm mt-2">
                  {notes}
                </p>
              )}
            </div>
          </div>

          {/* Services Table */}
          <div className="p-8 md:p-12 overflow-x-auto">
            <h2 className="text-slate-900 text-xl font-bold mb-6 flex items-center gap-2">
              <List className="h-5 w-5" style={{ color: primary }} />
              {t.detailedQuote}
            </h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th
                    className={`px-6 py-4 text-xs font-bold uppercase tracking-wider rounded-tl-lg ${
                      isRtl ? "text-right" : "text-left"
                    }`}
                  >
                    {t.itemDesc}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    {t.quantity}
                  </th>
                  <th
                    className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${
                      isRtl ? "text-left" : "text-right"
                    }`}
                  >
                    {t.unitPrice}
                  </th>
                  <th
                    className={`px-6 py-4 text-xs font-bold uppercase tracking-wider rounded-tr-lg ${
                      isRtl ? "text-left" : "text-right"
                    }`}
                  >
                    {t.total}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-6">
                      <p className="text-slate-900 font-semibold">{item.title}</p>
                      {(item.product_type || item.dimensions) && (
                        <p className="text-slate-500 text-xs mt-1">
                          {[item.product_type, item.dimensions]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-6 text-center text-slate-600">
                      {item.quantity}
                    </td>
                    <td
                      className={`px-6 py-6 text-slate-600 ${
                        isRtl ? "text-left" : "text-right"
                      }`}
                    >
                      <span dir="ltr">{formatPrice(item.unit_price)}</span>
                    </td>
                    <td
                      className={`px-6 py-6 text-slate-900 font-medium ${
                        isRtl ? "text-left" : "text-right"
                      }`}
                    >
                      <span dir="ltr">{formatPrice(item.total_price)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div
            className={`px-8 md:px-12 pb-12 flex ${isRtl ? "justify-start" : "justify-end"}`}
          >
            <div className="w-full max-w-[320px] flex flex-col gap-4">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-sm font-medium">{t.subtotal}</span>
                <span className="text-sm font-medium" dir="ltr">
                  {formatPrice(subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-sm font-medium">{t.discount}</span>
                  <span className="text-sm font-medium" dir="ltr">
                    -{formatPrice(discount)}
                  </span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-sm font-medium">{t.vat}</span>
                  <span className="text-sm font-medium" dir="ltr">
                    {formatPrice(tax)}
                  </span>
                </div>
              )}
              <div className="h-px bg-slate-200 my-1" />
              <div className="flex justify-between items-center">
                <span className="text-slate-900 font-black text-xl">
                  {t.totalToPay}
                </span>
                <span
                  className="text-3xl font-black"
                  style={{ color: primary }}
                  dir="ltr"
                >
                  {formatPrice(total)}
                </span>
              </div>
              <p
                className={`text-[10px] text-slate-400 italic mt-2 ${
                  isRtl ? "text-left" : "text-right"
                }`}
              >
                {t.priceDisclaimer}
              </p>
            </div>
          </div>

          {/* Payment Terms + Signature */}
          <div className="px-8 md:px-12 py-10 bg-slate-50 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="flex flex-col gap-2">
                <h4 className="text-slate-900 font-bold text-sm uppercase tracking-wide">
                  {t.paymentTerms}
                </h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {paymentTerms || defaultTerms}
                </p>
              </div>
              <div
                className={`flex flex-col gap-4 ${
                  isRtl ? "md:items-start" : "md:items-end"
                }`}
              >
                <div
                  className={`flex flex-col ${
                    isRtl ? "items-start" : "md:items-end"
                  }`}
                >
                  <h4 className="text-slate-900 font-bold text-sm uppercase tracking-wide mb-1">
                    {t.approval}
                  </h4>
                  <div className="w-full max-w-[240px] h-[60px] border-b-2 border-slate-300 mb-2" />
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    {t.clientSignature}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - matches Stitch design */}
          <footer className="py-8 px-12 border-t border-slate-100 text-center flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-8 text-slate-400 text-xs font-semibold">
              {contactInfo?.website && (
                <a
                  href={
                    contactInfo.website.startsWith("http")
                      ? contactInfo.website
                      : `https://${contactInfo.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-slate-600 transition-colors"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  {contactInfo.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
              {contactInfo?.email && (
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-1 hover:text-slate-600 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {contactInfo.email}
                </a>
              )}
              {contactInfo?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {contactInfo.phone}
                </span>
              )}
              {contactInfo?.whatsapp && (
                <a
                  href={
                    contactInfo.whatsapp.startsWith("http")
                      ? contactInfo.whatsapp
                      : `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-600 transition-colors"
                >
                  WhatsApp
                </a>
              )}
              {!contactInfo?.website &&
                !contactInfo?.email &&
                !contactInfo?.phone &&
                !contactInfo?.whatsapp && (
                  <span>{companyName}</span>
                )}
            </div>
            <p className="text-slate-300 text-[10px]">
              {companyName} © {new Date().getFullYear()}.{" "}
              {locale === "he"
                ? "כל הזכויות שמורות. מסמך רשמי."
                : "All Rights Reserved. This document is a formal quote and subject to our standard service agreement."}
            </p>
          </footer>
        </div>

        <div
          className={`flex mt-5 ${isRtl ? "justify-start" : "justify-end"}`}
        >
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
