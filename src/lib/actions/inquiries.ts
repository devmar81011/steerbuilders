"use server";

import { createClient } from "@/lib/supabase/server";
import { company } from "@/lib/company-content";

export type InquiryInput = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

function buildMailto(input: {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}): string {
  const subject = encodeURIComponent(`Project inquiry from ${input.name}`);
  const body = encodeURIComponent(
    `Name: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone || "—"}\n\n${input.message}`
  );
  return `mailto:${company.email}?subject=${subject}&body=${body}`;
}

function validate(input: InquiryInput): string | null {
  if (!input.name.trim()) return "Please enter your name.";
  if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return "Please enter a valid email address.";
  }
  if (!input.message.trim() || input.message.trim().length < 10) {
    return "Please tell us a bit more about your project (at least 10 characters).";
  }
  return null;
}

export async function submitInquiry(input: InquiryInput) {
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const payload = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    message: input.message.trim(),
  };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("inquiries").insert(payload);

    if (error) {
      return {
        error: null as string | null,
        fallbackMailto: buildMailto(payload),
        usedMailto: true,
      };
    }

    return { success: true as const };
  } catch {
    return {
      error: null as string | null,
      fallbackMailto: buildMailto(payload),
      usedMailto: true,
    };
  }
}
