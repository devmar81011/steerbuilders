"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const initialState: ChangePasswordState = {};

type Props = {
  email: string;
};

export function AccountSettingsClient({ email }: Props) {
  const [state, action, pending] = useActionState(changePassword, initialState);

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Signed in as
        </p>
        <p className="mt-2 text-lg font-semibold text-sbc-black">{email}</p>
        <p className="mt-2 text-sm text-sbc-gray">
          Administrator account for the Steer Builders payroll system.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-bold uppercase tracking-widest text-sbc-gold">
          Change Password
        </h2>
        <p className="mt-2 text-sm text-sbc-gray">
          Enter your current password, then choose a new one with at least 8
          characters.
        </p>

        <form action={action} className="mt-6 flex flex-col gap-4">
          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
          <Input
            label="New Password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          {state.error && (
            <p
              role="alert"
              className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
            >
              {state.error}
            </p>
          )}

          {state.success && (
            <p className="rounded-lg border border-sbc-gold/30 bg-sbc-gold/10 px-3 py-2 text-sm font-semibold text-sbc-black">
              {state.success}
            </p>
          )}

          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
