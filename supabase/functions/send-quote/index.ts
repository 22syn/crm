import { serve } from "https://deno.land/std@0.190.0/http/server.ts";


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
    const data: SendQuoteRequest = await req.json();
    
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.title}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₪${item.unit_price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₪${item.total_price.toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; }
          table { width: 100%; border-collapse: collapse; background: white; margin: 20px 0; }
          th { background: #f3f4f6; padding: 12px; text-align: right; }
          .totals { background: white; padding: 15px; border-radius: 8px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .grand-total { font-size: 1.25rem; font-weight: bold; border-top: 2px solid #e5e7eb; padding-top: 10px; margin-top: 10px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 0.875rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">הצעת מחיר</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.quoteNumber}</p>
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
              <div class="total-row" style="color: #059669;">
                <span>הנחה:</span>
                <span>-₪${data.discount.toFixed(2)}</span>
              </div>
              ` : ''}
              ${data.tax > 0 ? `
              <div class="total-row">
                <span>מע"מ:</span>
                <span>₪${data.tax.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>סה"כ לתשלום:</span>
                <span>₪${data.total.toFixed(2)}</span>
              </div>
            </div>
            
            ${data.validUntil ? `<p style="color: #6b7280; margin-top: 20px;">הצעה זו בתוקף עד: ${new Date(data.validUntil).toLocaleDateString('he-IL')}</p>` : ''}
            
            ${data.notes ? `<p style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;"><strong>הערות:</strong><br>${data.notes}</p>` : ''}
            
            <p style="margin-top: 30px;">לאישור ההצעה או לשאלות נוספות, אנא צרו קשר.</p>
          </div>
          
          <div class="footer">
            <p>הצעה זו הופקה אוטומטית ממערכת ה-CRM</p>
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
