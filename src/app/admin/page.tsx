import { AdminOpsHome } from "@/components/admin/admin-ops-home";

export default function AdminHomePage() {
  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Home</h1>
        <p className="mt-2 max-w-xl text-sm font-semibold text-sbc-gray">
          Choose what you need to do — upload payroll or manage projects.
        </p>
      </div>

      <AdminOpsHome />
    </>
  );
}
