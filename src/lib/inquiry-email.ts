import { company } from "@/lib/company-content";

export type InquiryEmailPayload = {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  createdAt?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(dateString?: string): string {
  const date = dateString ? new Date(dateString) : new Date();
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

function notificationEmail(): string {
  return process.env.INQUIRY_NOTIFICATION_EMAIL?.trim() || company.email;
}

function buildHtml(inquiry: InquiryEmailPayload): string {
  const submitted = formatDate(inquiry.createdAt);
  const name = escapeHtml(inquiry.name);
  const email = escapeHtml(inquiry.email);
  const phone = inquiry.phone ? escapeHtml(inquiry.phone) : "";
  const message = escapeHtml(inquiry.message).replaceAll("\n", "<br>");

  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1a1a1a;margin:0;padding:0;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">
      <div style="background-color:#C8A15A;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:24px;">New Inquiry Received</h1>
      </div>
      <div style="background-color:#ffffff;border:1px solid #e5e5e5;border-top:none;padding:30px;border-radius:0 0 8px 8px;">
        <p style="font-size:12px;text-transform:uppercase;font-weight:600;color:#666;letter-spacing:0.5px;margin:0 0 5px;">Submitted</p>
        <p style="margin:0 0 20px;">${submitted}</p>
        <p style="font-size:12px;text-transform:uppercase;font-weight:600;color:#666;letter-spacing:0.5px;margin:0 0 5px;">Name</p>
        <p style="margin:0 0 20px;"><strong>${name}</strong></p>
        <p style="font-size:12px;text-transform:uppercase;font-weight:600;color:#666;letter-spacing:0.5px;margin:0 0 5px;">Email</p>
        <p style="margin:0 0 20px;"><a href="mailto:${email}" style="color:#C8A15A;">${email}</a></p>
        ${
          phone
            ? `<p style="font-size:12px;text-transform:uppercase;font-weight:600;color:#666;letter-spacing:0.5px;margin:0 0 5px;">Phone</p>
        <p style="margin:0 0 20px;"><a href="tel:${phone}" style="color:#C8A15A;">${phone}</a></p>`
            : ""
        }
        <p style="font-size:12px;text-transform:uppercase;font-weight:600;color:#666;letter-spacing:0.5px;margin:0 0 5px;">Project Details</p>
        <div style="background-color:#f8f8f8;border-left:3px solid #C8A15A;padding:15px;margin-top:10px;">${message}</div>
        <p style="text-align:center;margin-top:24px;">
          <a href="https://steerbuilders.vercel.app/admin/inquiries" style="display:inline-block;background-color:#C8A15A;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">View in Admin Dashboard</a>
        </p>
      </div>
    </div>
  </body>
</html>`;
}

function buildText(inquiry: InquiryEmailPayload): string {
  return [
    "New Inquiry Received",
    `Submitted: ${formatDate(inquiry.createdAt)}`,
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    inquiry.phone ? `Phone: ${inquiry.phone}` : null,
    "",
    "Project Details:",
    inquiry.message,
    "",
    "View in admin dashboard: https://steerbuilders.vercel.app/admin/inquiries",
  ]
    .filter((line) => line != null)
    .join("\n");
}

/** Server-side send via Resend when RESEND_API_KEY is set. Never throws. */
export async function sendInquiryNotification(
  inquiry: InquiryEmailPayload
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  try {
    const from =
      process.env.RESEND_FROM?.trim() ||
      "Steer Builders <beth.t@example.com>";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [notificationEmail()],
        reply_to: inquiry.email,
        subject: `New Inquiry from ${inquiry.name}`,
        html: buildHtml(inquiry),
        text: buildText(inquiry),
      }),
    });

    if (!response.ok) {
      console.error(
        "Resend inquiry email failed:",
        response.status,
        await response.text()
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Inquiry notification email failed:", error);
    return false;
  }
}
