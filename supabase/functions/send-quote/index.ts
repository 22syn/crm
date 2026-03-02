import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function getCorsHeaders(req: Request) {
  const origins = Deno.env.get("ALLOWED_ORIGINS")?.split(",").map((s) => s.trim()) ?? ["*"];
  const reqOrigin = req.headers.get("Origin");
  const allowOrigin =
    origins.includes("*") || (reqOrigin && origins.includes(reqOrigin)) ? (reqOrigin ?? origins[0]) : origins[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const corsHeadersStatic = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface QuoteItem {
  title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SendQuoteRequest {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  quoteNumber: string;
  quoteDate?: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil?: string;
  notes?: string;
  paymentTerms?: string;
  companyName?: string;
}

const sendQuoteSchema = z.object({
  customerName: z.string().min(1).max(500),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(50).optional(),
  customerAddress: z.string().max(500).optional(),
  quoteNumber: z.string().min(1).max(100),
  quoteDate: z.string().optional(),
  items: z
    .array(
      z.object({
        title: z.string().max(500),
        quantity: z.number().int().min(0),
        unit_price: z.number().min(0),
        total_price: z.number().min(0),
      })
    )
    .min(1)
    .max(100),
  subtotal: z.number(),
  discount: z.number(),
  tax: z.number(),
  total: z.number(),
  validUntil: z.string().optional(),
  notes: z.string().max(2000).optional(),
  paymentTerms: z.string().max(500).optional(),
  companyName: z.string().max(200).optional(),
});

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = { ...corsHeadersStatic, ...getCorsHeaders(req) };
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;

    // Verify user has CRM access (user_module_roles — modular permissions)
    const { data: moduleRoles } = await supabaseClient
      .from('user_module_roles')
      .select('module')
      .eq('user_id', userId);

    if (!moduleRoles || moduleRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Forbidden - No CRM access" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const parsed = sendQuoteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const data = parsed.data as SendQuoteRequest;
    const companyName = data.companyName ?? "הר סיני הפקות";
    const headerSubline = [data.quoteNumber, data.quoteDate ? new Date(data.quoteDate).toLocaleDateString("he-IL") : null]
      .filter(Boolean)
      .join(" / ");

    const formatPrice = (n: number) => `₪${n.toFixed(2)}`;

    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 12px 8px; border-top: 1px solid #2A2A2A; color: #B7B7B7; font-size: 11px; line-height: 1.6;">${escapeHtml(item.title)}</td>
        <td style="padding: 12px 8px; border-top: 1px solid #2A2A2A; text-align: center; color: #B7B7B7; font-size: 11px;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-top: 1px solid #2A2A2A; text-align: right; color: #FFFFFF; font-size: 12px; font-weight: 500;"><span dir="ltr">${formatPrice(item.unit_price)}</span></td>
        <td style="padding: 12px 8px; border-top: 1px solid #2A2A2A; text-align: right; color: #FFFFFF; font-size: 12px; font-weight: 500;"><span dir="ltr">${formatPrice(item.total_price)}</span></td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600&display=swap');
          body { font-family: 'Heebo', Arial, sans-serif; margin: 0; padding: 0; background: #0F0F0F; color: #FFFFFF; line-height: 1.6; }
          .doc { max-width: 720px; margin: 0 auto; padding: 28px 36px; }
          .h1 { font-size: 24px; font-weight: 600; margin: 0; }
          .h2 { font-size: 15px; font-weight: 500; margin: 0 0 12px 0; }
          .body { font-size: 11px; color: #B7B7B7; line-height: 1.6; }
          .divider { height: 1px; background: #2A2A2A; margin: 24px 0; }
          .header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; }
          .price-cell { font-size: 12px; font-weight: 500; color: #FFFFFF; text-align: right; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { padding: 12px 8px; text-align: right; font-weight: 500; color: #FFFFFF; }
          .summary-row { border-top: 1px solid #2A2A2A; padding: 12px 0 8px; font-size: 12px; font-weight: 500; color: #FFFFFF; display: flex; justify-content: space-between; }
          .terms-text { font-size: 10.5px; line-height: 1.8; color: #B7B7B7; }
          a { color: #FFFFFF; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="doc">
          <div class="header-row">
            <div>
              <h1 class="h1">הצעת מחיר.</h1>
              ${headerSubline ? `<p class="body" style="margin-top: 4px;">${escapeHtml(String(headerSubline ?? ""))}</p>` : ""}
            </div>
            <div style="font-size: 14px; font-weight: 500;">${escapeHtml(companyName)}</div>
          </div>
          <div class="divider"></div>

          <section style="margin-bottom: 24px;">
            <h2 class="h2">תכולת עבודה.</h2>
            <p class="body">${escapeHtml(data.customerName)}${data.customerAddress ? ` · ${escapeHtml(data.customerAddress)}` : ""}</p>
            <p class="body" style="margin-top: 8px;">מצורפת הצעת המחיר להמשך.</p>
          </section>
          <div class="divider"></div>

          <section style="margin-bottom: 24px;">
            <h2 class="h2">תמחור.</h2>
            <table>
              <thead>
                <tr>
                  <th style="text-align: right;">פריט</th>
                  <th style="text-align: center;">כמות</th>
                  <th style="text-align: right;">מחיר ליחידה</th>
                  <th style="text-align: right;">סה״כ</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="summary-row">
              <span>סה״כ לתשלום.</span>
              <span dir="ltr">${formatPrice(data.total)}</span>
            </div>
          </section>

          ${(data.paymentTerms || data.validUntil || data.notes) ? `
          <div class="divider"></div>
          <section style="margin-bottom: 24px;">
            <h2 class="h2">תנאים.</h2>
            <div class="terms-text">
              ${data.paymentTerms ? `<p style="margin: 0;">${escapeHtml(data.paymentTerms ?? "")}</p>` : ""}
              ${data.validUntil ? `<p style="margin: ${data.paymentTerms ? "8px" : "0"} 0 0 0;">תוקף עד: ${new Date(data.validUntil).toLocaleDateString("he-IL")}</p>` : ""}
              ${data.notes ? `<p style="margin: ${(data.paymentTerms || data.validUntil) ? "8px" : "0"} 0 0 0;">${escapeHtml(data.notes ?? "")}</p>` : ""}
            </div>
          </section>
          ` : ""}

          <div class="divider"></div>
          <footer>
            <h2 class="h2">יצירת קשר.</h2>
            <p class="body">${escapeHtml(companyName)}</p>
          </footer>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CRM <onboarding@resend.dev>",
        to: [data.customerEmail],
        subject: `הצעת מחיר ${data.quoteNumber}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Resend API error: ${errorData}`);
    }

    const result = await emailResponse.json();
    console.log("Quote email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending quote email:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
