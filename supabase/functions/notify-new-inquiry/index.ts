// Edge Function to send email notifications for new inquiries
// Triggered by database webhook when a new inquiry is inserted

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFICATION_EMAIL = Deno.env.get("INQUIRY_NOTIFICATION_EMAIL") || "info@steerbuilderscorporation.com";

interface InquiryRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: InquiryRecord;
  schema: string;
  old_record: InquiryRecord | null;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  }).format(date);
}

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify Resend API key is configured
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse webhook payload
    const payload: WebhookPayload = await req.json();
    
    // Only process INSERT events for inquiries table
    if (payload.type !== "INSERT" || payload.table !== "inquiries") {
      return new Response(JSON.stringify({ message: "Event ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const inquiry = payload.record;

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #C8A15A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background-color: #ffffff; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 20px; }
            .label { font-size: 12px; text-transform: uppercase; font-weight: 600; color: #666; letter-spacing: 0.5px; margin-bottom: 5px; }
            .value { font-size: 15px; color: #1a1a1a; }
            .message-box { background-color: #f8f8f8; border-left: 3px solid #C8A15A; padding: 15px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .button { display: inline-block; background-color: #C8A15A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
            a { color: #C8A15A; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📩 New Inquiry Received</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Submitted</div>
                <div class="value">${formatDate(inquiry.created_at)}</div>
              </div>
              
              <div class="field">
                <div class="label">Name</div>
                <div class="value"><strong>${inquiry.name}</strong></div>
              </div>
              
              <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:${inquiry.email}">${inquiry.email}</a></div>
              </div>
              
              ${inquiry.phone ? `
              <div class="field">
                <div class="label">Phone</div>
                <div class="value"><a href="tel:${inquiry.phone}">${inquiry.phone}</a></div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="label">Project Details</div>
                <div class="message-box">${inquiry.message.replace(/\n/g, '<br>')}</div>
              </div>
              
              <div style="text-align: center;">
                <a href="https://steerbuilders.vercel.app/admin/inquiries" class="button">
                  View in Admin Dashboard
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>
                Steer Builders Corporation<br>
                <a href="https://steerbuilders.vercel.app">steerbuilders.vercel.app</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
New Inquiry Received

Submitted: ${formatDate(inquiry.created_at)}
Name: ${inquiry.name}
Email: ${inquiry.email}
${inquiry.phone ? `Phone: ${inquiry.phone}` : ''}

Project Details:
${inquiry.message}

View in admin dashboard: https://steerbuilders.vercel.app/admin/inquiries
    `.trim();

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Steer Builders Website <inquiries@steerbuilders.com>",
        to: [NOTIFICATION_EMAIL],
        subject: `New Inquiry from ${inquiry.name}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", resendData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: resendData.id,
        message: "Notification email sent"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in notify-new-inquiry function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
