"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginState = {};
const REMEMBER_EMAIL_KEY = "sbc-admin-remember-email";
const REMEMBER_ME_KEY = "sbc-admin-remember-me";

function getRememberedLogin() {
  if (typeof window === "undefined") {
    return { email: "", rememberMe: true };
  }

  const remembered = localStorage.getItem(REMEMBER_ME_KEY) !== "false";
  const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
  return {
    email: remembered && savedEmail ? savedEmail : "",
    rememberMe: remembered,
  };
}

export function LoginForm({
  supabaseConfigured = true,
}: {
  supabaseConfigured?: boolean;
}) {
  const [state, action, pending] = useActionState(login, initialState);
  const [email, setEmail] = useState(() => getRememberedLogin().email);
  const [rememberMe, setRememberMe] = useState(() => getRememberedLogin().rememberMe);

  function handleSubmit() {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, "true");
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } else {
      localStorage.setItem(REMEMBER_ME_KEY, "false");
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      <label className="flex cursor-pointer items-center gap-2 text-sm text-sbc-gray">
        <input
          type="checkbox"
          name="rememberMe"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          className="h-4 w-4 accent-sbc-gold"
        />
        <span>Remember me on this device</span>
      </label>

      {state.error && (
        <p
          role="alert"
          className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
        >
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={pending || !supabaseConfigured}
      >
        {pending ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
