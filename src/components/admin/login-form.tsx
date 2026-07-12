"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginState = {};

export function LoginForm({ supabaseConfigured = true }: { supabaseConfigured?: boolean }) {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
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
      <Button type="submit" className="w-full" disabled={pending || !supabaseConfigured}>
        {pending ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
