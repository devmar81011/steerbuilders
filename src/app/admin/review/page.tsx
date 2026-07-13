import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { runContentReview, getReviewSummary } from "@/lib/content-reviewer";

const severityVariant = {
  pass: "gold" as const,
  warn: "light" as const,
  fail: "dark" as const,
};

export default function AdminReviewPage() {
  const findings = runContentReview();
  const summary = getReviewSummary(findings);

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Content Reviewer Agent
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">PDF Alignment Check</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-sbc-gray">
          Automated review comparing live site content against the Steer Builders
          Company Profile PDF. Re-run after any copy or portfolio updates.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">Pass</p>
          <p className="mt-2 text-3xl font-bold text-sbc-gold">{summary.pass}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">Warnings</p>
          <p className="mt-2 text-3xl font-bold">{summary.warn}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">Failures</p>
          <p className="mt-2 text-3xl font-bold">{summary.fail}</p>
        </Card>
        <Card variant={summary.aligned ? "default" : "dark"}>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">Status</p>
          <p className="mt-2 text-lg font-bold">
            {summary.aligned ? "Aligned with PDF" : "Needs attention"}
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        {findings.map((finding) => (
          <Card key={finding.id} className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
                  {finding.area}
                </p>
                <p className="mt-1 font-semibold text-sbc-black">{finding.message}</p>
                {finding.expected && (
                  <p className="mt-2 text-xs font-medium text-sbc-gray">
                    PDF: {finding.expected}
                  </p>
                )}
                {finding.actual && (
                  <p className="text-xs font-medium text-sbc-gray">Site: {finding.actual}</p>
                )}
              </div>
              <Badge variant={severityVariant[finding.severity]}>{finding.severity}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
