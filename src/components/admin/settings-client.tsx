"use client";

import { useState, useTransition } from "react";
import { SitesClient } from "@/components/admin/sites-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setDisbursementMethods } from "@/lib/actions/site-settings";
import type { Site } from "@/lib/actions/sites";

type Props = {
  sites: Site[];
  initialDisbursementMethods: string[];
};

export function SettingsClient({
  sites,
  initialDisbursementMethods,
}: Props) {
  const [methods, setMethods] = useState(initialDisbursementMethods);
  const [newMethod, setNewMethod] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAddMethod(e: React.FormEvent) {
    e.preventDefault();
    const next = newMethod.trim();
    if (!next) return;
    if (methods.some((method) => method.toLowerCase() === next.toLowerCase())) {
      setMessage("That disbursement method already exists.");
      return;
    }

    const updated = [...methods, next];
    startTransition(async () => {
      const result = await setDisbursementMethods(updated);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMethods(result.methods ?? updated);
      setNewMethod("");
      setMessage("Disbursement methods saved.");
    });
  }

  function handleRemoveMethod(name: string) {
    if (methods.length <= 1) {
      setMessage("Keep at least one disbursement method.");
      return;
    }

    const updated = methods.filter((method) => method !== name);
    startTransition(async () => {
      const result = await setDisbursementMethods(updated);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMethods(result.methods ?? updated);
      setMessage("Disbursement methods saved.");
    });
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Settings</h1>
        <p className="mt-2 text-sm font-semibold text-sbc-gray">
          Manage project sites and payroll disbursement options used across
          attendance and payroll.
        </p>
      </div>

      {message && (
        <p className="mb-6 rounded-lg border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
          {message}
        </p>
      )}

      <section className="mb-10">
        <SitesClient sites={sites} embedded />
      </section>

      <section>
        <Card>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-sbc-gold">
            Disbursement Methods
          </p>
          <p className="mb-4 text-sm text-sbc-gray">
            These options appear in Payroll when choosing how pay is released
            (default: MLhuilier and BPI).
          </p>

          <ul className="mb-4 space-y-2">
            {methods.map((method) => (
              <li
                key={method}
                className="flex items-center justify-between rounded-lg border border-sbc-gray-light px-3 py-2 text-sm font-semibold text-sbc-black"
              >
                <span>{method}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending || methods.length <= 1}
                  onClick={() => handleRemoveMethod(method)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddMethod} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <Input
                label="Add method"
                size="sm"
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value)}
                placeholder="e.g. Cash"
              />
            </div>
            <Button type="submit" size="sm" disabled={pending || !newMethod.trim()}>
              + Add
            </Button>
          </form>
        </Card>
      </section>
    </>
  );
}
