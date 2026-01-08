import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  quoteNumber: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil?: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
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

    // Verify user has CRM access
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Forbidden - No CRM access" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data: SendQuoteRequest = await req.json();
    
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e8e4de; color: #5a5347;">${item.title}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e8e4de; text-align: center; color: #5a5347;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e8e4de; text-align: right; color: #5a5347;">₪${item.unit_price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e8e4de; text-align: right; color: #5a5347;">₪${item.total_price.toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600&display=swap');
          body { font-family: 'Heebo', Arial, sans-serif; line-height: 1.6; color: #5a5347; background: #f8f6f3; }
          .container { max-width: 600px; margin: 0 auto; background: #f8f6f3; }
          .header { background: #3d3830; color: #f8f6f3; padding: 40px 20px; text-align: center; }
          .logo { font-size: 32px; font-weight: 300; letter-spacing: 8px; margin-bottom: 8px; }
          .logo-sub { font-size: 10px; letter-spacing: 4px; text-transform: uppercase; opacity: 0.7; }
          .divider { width: 60px; height: 1px; background: #c4b8a8; margin: 20px auto; }
          .content { padding: 40px 30px; }
          table { width: 100%; border-collapse: collapse; margin: 25px 0; }
          th { border-bottom: 2px solid #c4b8a8; padding: 12px; text-align: right; font-weight: 500; color: #3d3830; }
          .totals { background: rgba(255,255,255,0.5); padding: 20px; border-radius: 4px; border: 1px solid #e8e4de; margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; color: #5a5347; }
          .grand-total { font-size: 1.15rem; font-weight: 500; color: #3d3830; border-top: 2px solid #c4b8a8; padding-top: 12px; margin-top: 12px; }
          .footer { text-align: center; padding: 30px; border-top: 1px solid #e8e4de; color: #8a8279; font-size: 0.875rem; }
          .notes { background: #f0ebe3; padding: 15px; border-radius: 4px; border: 1px solid #e0d9ce; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">הדריה</div>
            <div class="logo-sub">By Elle</div>
            <div class="divider"></div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 300; letter-spacing: 2px;">הצעת מחיר</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.8; font-size: 14px;">${data.quoteNumber}</p>
          </div>
          
          <div class="content">
            <p>שלום ${data.customerName},</p>
            <p>תודה על פנייתך! מצורפת הצעת המחיר שלך:</p>
            
            <table>
              <thead>
                <tr>
                  <th style="text-align: right;">פריט</th>
                  <th style="text-align: center;">כמות</th>
                  <th style="text-align: right;">מחיר ליחידה</th>
                  <th style="text-align: right;">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="total-row">
                <span>סכום ביניים:</span>
                <span>₪${data.subtotal.toFixed(2)}</span>
              </div>
              ${data.discount > 0 ? `
              <div class="total-row" style="color: #6b8e6b;">
                <span>הנחה:</span>
                <span>-₪${data.discount.toFixed(2)}</span>
              </div>
              ` : ''}
              ${data.tax > 0 ? `
              <div class="total-row">
                <span>מע"מ (17%):</span>
                <span>₪${data.tax.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>סה"כ לתשלום:</span>
                <span>₪${data.total.toFixed(2)}</span>
              </div>
            </div>
            
            ${data.validUntil ? `<p style="color: #8a8279; margin-top: 25px; font-size: 14px;">הצעה זו בתוקף עד: ${new Date(data.validUntil).toLocaleDateString('he-IL')}</p>` : ''}
            
            ${data.notes ? `<div class="notes"><strong style="color: #3d3830;">הערות:</strong><br>${data.notes}</div>` : ''}
            
            <p style="margin-top: 30px;">לאישור ההצעה או לשאלות נוספות, אנא צרו קשר.</p>
          </div>
          
          <div class="footer">
            <p style="font-weight: 300; font-style: italic;">Because ordinary isn't an option</p>
            <p style="margin-top: 8px; font-size: 12px;">hadaryadesign.com</p>
          </div>
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
  } catch (error: any) {
    console.error("Error sending quote email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
