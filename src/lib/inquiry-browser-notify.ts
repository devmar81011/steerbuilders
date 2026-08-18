import { company } from "@/lib/company-content";

type InquiryNotifyPayload = {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
};

/** Browser-side office notify. FormSubmit blocks Vercel IPs, so this runs from the visitor. */
export function notifyOfficeFromBrowser(payload: InquiryNotifyPayload) {
  if (typeof document === "undefined") return;

  const iframeName = "sbc-inquiry-notify";
  document.querySelector(`iframe[name="${iframeName}"]`)?.remove();
  document.getElementById("sbc-inquiry-notify-form")?.remove();

  const iframe = document.createElement("iframe");
  iframe.name = iframeName;
  iframe.setAttribute("aria-hidden", "true");
  iframe.tabIndex = -1;
  iframe.style.cssText =
    "position:absolute;width:0;height:0;border:0;overflow:hidden;opacity:0";

  const form = document.createElement("form");
  form.id = "sbc-inquiry-notify-form";
  form.method = "POST";
  form.action = `https://formsubmit.co/${company.email}`;
  form.target = iframeName;
  form.style.display = "none";

  const fields: Record<string, string> = {
    _subject: `New Inquiry from ${payload.name}`,
    _template: "table",
    _captcha: "false",
    _next: `${window.location.origin}/`,
    name: payload.name,
    email: payload.email,
    phone: payload.phone || "—",
    message: payload.message,
  };

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.append(iframe, form);
  form.submit();
  window.setTimeout(() => {
    form.remove();
    iframe.remove();
  }, 12000);
}
