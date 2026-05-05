"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { AuthActionState } from "@/app/(auth)/actions";

const inputCls =
  "block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelCls = "block text-xs font-semibold text-ink-700";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition-all hover:bg-brand-600 hover:shadow-md hover:shadow-brand-500/40 disabled:pointer-events-none disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

interface BaseProps {
  action: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
}

export function LoginForm({ action }: BaseProps) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    action,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className={labelCls}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@business.com"
          required
          className={inputCls}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className={labelCls}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          className={inputCls}
        />
      </div>
      {state && !state.ok && (
        <p className="rounded-lg border border-rose/40 bg-rose/5 px-3 py-2 text-sm text-rose">
          {state.error}
        </p>
      )}
      <SubmitButton>Log in</SubmitButton>
    </form>
  );
}

export function SignupForm({ action }: BaseProps) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    action,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className={labelCls}>
          Name
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Jane Doe"
          required
          className={inputCls}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className={labelCls}>
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@business.com"
          required
          className={inputCls}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className={labelCls}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
          className={inputCls}
        />
      </div>
      {state && !state.ok && (
        <p className="rounded-lg border border-rose/40 bg-rose/5 px-3 py-2 text-sm text-rose">
          {state.error}
        </p>
      )}
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}
