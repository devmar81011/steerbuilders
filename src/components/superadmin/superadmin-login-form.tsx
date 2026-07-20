"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function SuperadminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Could not sign in.");
        setPending(false);
        return;
      }
      router.push("/superadmin/tools");
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setPending(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
        Super Admin
      </p>
      <h1 className="mt-2 text-2xl font-bold text-sbc-black">Sign in</h1>
      <p className="mt-2 text-sm text-sbc-gray">
        Use this area only to reset operational data for demos and testing.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p
            role="alert"
            className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}

        <Button type="submit" size="sm" disabled={pending || !password}>
          {pending ? "Signing in…" : "Continue"}
        </Button>
      </form>
    </Card>
  );
}
