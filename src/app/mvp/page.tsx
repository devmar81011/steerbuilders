import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import {
  MVP_VERSION,
  MVP_UPDATED,
  mvpPhases,
  getMvpProgress,
  type FeatureStatus,
} from "@/lib/mvp-status";

const statusStyles: Record<FeatureStatus, { label: string; variant: "gold" | "dark" | "light" }> = {
  done: { label: "Done", variant: "gold" },
  in_progress: { label: "In Progress", variant: "dark" },
  planned: { label: "Planned", variant: "light" },
};

export default function MvpStatusPage() {
  const progress = getMvpProgress();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Section dark>
          <Link
            href="/"
            className="mb-6 inline-block text-xs font-medium uppercase tracking-widest text-sbc-gold hover:underline"
          >
            ← Back to Home
          </Link>
          <SectionHeader
            label={`MVP v${MVP_VERSION} · Updated ${MVP_UPDATED}`}
            title="Project Roadmap"
            description="This page auto-reflects src/lib/mvp-status.ts. Update that file whenever features ship."
            light
          />
          <div className="mt-8 flex items-center gap-6">
            <div className="text-5xl font-bold text-sbc-gold">{progress.percent}%</div>
            <div className="text-sm font-semibold text-sbc-gray-light">
              <p>{progress.done} done</p>
              <p>{progress.inProgress} in progress</p>
              <p>{progress.planned} planned</p>
            </div>
          </div>
          <div className="mt-4 h-2 w-full max-w-md bg-sbc-gray/30">
            <div
              className="h-full bg-sbc-gold transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </Section>

        {mvpPhases.map((phase) => (
          <Section key={phase.id}>
            <SectionHeader title={phase.name} />
            <div className="grid gap-4 md:grid-cols-2">
              {phase.features.map((feature) => {
                const style = statusStyles[feature.status];
                return (
                  <Card key={feature.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-sbc-black">{feature.name}</h3>
                        {feature.notes && (
                          <p className="mt-2 text-sm font-semibold text-sbc-gray">
                            {feature.notes}
                          </p>
                        )}
                        {feature.route && (
                          <Link
                            href={feature.route}
                            className="mt-2 inline-block text-xs font-medium text-sbc-gold hover:underline"
                          >
                            {feature.route} →
                          </Link>
                        )}
                      </div>
                      <Badge variant={style.variant}>{style.label}</Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Section>
        ))}

        <Section>
          <Card>
            <h3 className="font-bold text-sbc-black">How to keep this updated</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-semibold text-sbc-gray">
              <li>Ship a feature in code</li>
              <li>
                Update <code className="text-sbc-gold">src/lib/mvp-status.ts</code> — change
                status to <code className="text-sbc-gold">done</code>
              </li>
              <li>
                Add entry to <code className="text-sbc-gold">CHANGELOG.md</code>
              </li>
              <li>Push to GitHub — Vercel auto-deploys</li>
            </ol>
          </Card>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
