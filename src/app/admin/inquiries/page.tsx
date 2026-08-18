import { InquiriesClient } from "@/components/admin/inquiries-client";
import { getInquiries } from "@/lib/actions/inquiries-admin";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const inquiries = await getInquiries();

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Inquiries</h1>
        <p className="mt-2 max-w-xl text-sm font-semibold text-sbc-gray">
          View and manage contact form submissions from potential clients.
        </p>
      </div>

      <InquiriesClient inquiries={inquiries} />
    </>
  );
}
