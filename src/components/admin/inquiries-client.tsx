"use client";

import { useState, useTransition } from "react";
import type { Inquiry } from "@/lib/actions/inquiries-admin";
import { deleteInquiry } from "@/lib/actions/inquiries-admin";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function InquiryCard({ inquiry, onDelete }: { inquiry: Inquiry; onDelete: () => void }) {
  const [pending, startTransition] = useTransition();
  const [showFull, setShowFull] = useState(false);

  function handleDelete() {
    if (!confirm(`Delete inquiry from ${inquiry.name}?`)) return;

    startTransition(async () => {
      const result = await deleteInquiry(inquiry.id);
      if (result.success) {
        onDelete();
      } else {
        alert(result.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-sbc-gray-light bg-sbc-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            {formatDate(inquiry.created_at)}
          </p>
          <h3 className="mt-2 text-lg font-bold text-sbc-gold">{inquiry.name}</h3>
          
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-sbc-black">
              <span className="font-semibold">Email:</span>{" "}
              <a href={`mailto:${inquiry.email}`} className="text-sbc-gold hover:underline">
                {inquiry.email}
              </a>
            </p>
            {inquiry.phone && (
              <p className="text-sbc-black">
                <span className="font-semibold">Phone:</span>{" "}
                <a href={`tel:${inquiry.phone}`} className="text-sbc-gold hover:underline">
                  {inquiry.phone}
                </a>
              </p>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-sbc-gray">
              Message
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-sbc-black">
              {showFull || inquiry.message.length <= 200
                ? inquiry.message
                : `${inquiry.message.slice(0, 200)}...`}
            </p>
            {inquiry.message.length > 200 && (
              <button
                type="button"
                onClick={() => setShowFull(!showFull)}
                className="mt-2 text-xs font-semibold uppercase tracking-widest text-sbc-gold hover:underline"
              >
                {showFull ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-md border border-red-500/50 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-700 transition-colors hover:border-red-600 hover:bg-red-100 disabled:opacity-50"
        >
          {pending ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}

export function InquiriesClient({ inquiries: initialInquiries }: { inquiries: Inquiry[] }) {
  const [inquiries, setInquiries] = useState(initialInquiries);

  function handleDelete(id: string) {
    setInquiries((prev) => prev.filter((inq) => inq.id !== id));
  }

  if (inquiries.length === 0) {
    return (
      <div className="rounded-lg border border-sbc-gray-light bg-sbc-off-white p-12 text-center">
        <p className="text-sm font-semibold text-sbc-gray">
          No inquiries received yet. When someone submits the contact form on your website,
          it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-sbc-gold/40 bg-sbc-gold/10 px-6 py-4">
        <p className="text-sm font-semibold text-sbc-black">
          <span className="font-bold text-sbc-gold">{inquiries.length}</span>{" "}
          {inquiries.length === 1 ? "inquiry" : "inquiries"} received
        </p>
      </div>

      <div className="space-y-4">
        {inquiries.map((inquiry) => (
          <InquiryCard
            key={inquiry.id}
            inquiry={inquiry}
            onDelete={() => handleDelete(inquiry.id)}
          />
        ))}
      </div>
    </div>
  );
}
