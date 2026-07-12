"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitInquiry } from "@/lib/actions/inquiries";
import { company } from "@/lib/company-content";

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setErrorMessage(null);

    startTransition(async () => {
      const result = await submitInquiry(form);

      if (result.success) {
        setSubmittedName(form.name.trim());
        setStatus("success");
        setForm({ name: "", email: "", phone: "", message: "" });
        return;
      }

      if (result.error) {
        setStatus("error");
        setErrorMessage(result.error);
        return;
      }

      if (result.fallbackMailto) {
        window.location.href = result.fallbackMailto;
      }
    });
  }

  if (status === "success") {
    return (
      <div className="border border-sbc-gold/40 bg-sbc-gold/10 px-6 py-8 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
          Inquiry received
        </p>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-sbc-gray-light">
          Thank you, {submittedName || "there"}. Our team will review your message and
          get back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-xs font-semibold uppercase tracking-widest text-sbc-gold hover:underline"
        >
          Send another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <p className="text-sm font-semibold text-sbc-gray-light">
        Share your project details and we&apos;ll respond within 1–2 business days.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Full Name"
          tone="dark"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Juan Dela Cruz"
          required
          autoComplete="name"
        />
        <Input
          label="Email"
          tone="dark"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <Input
        label="Phone (optional)"
        tone="dark"
        type="tel"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        placeholder={company.phone}
        autoComplete="tel"
      />

      <Textarea
        label="Project Details"
        tone="dark"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        placeholder="Location, scope of work, timeline, budget range..."
        required
        rows={5}
      />

      {status === "error" && errorMessage && (
        <p className="border border-red-400/40 bg-red-950/30 px-4 py-3 text-sm font-semibold text-red-200">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" tone="dark" disabled={pending}>
          {pending ? "Sending…" : "Send Inquiry"}
        </Button>
        <p className="text-xs font-medium text-sbc-gray">
          Or email{" "}
          <a href={company.emailHref} className="text-sbc-gold hover:underline">
            {company.email}
          </a>
        </p>
      </div>
    </form>
  );
}
