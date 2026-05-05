import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-form";
import { FacebookButton } from "@/components/auth/facebook-button";
import { loginAction } from "../actions";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Rocketeerio account.",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Your sign-in attempt expired. Please try again.",
  missing_code: "Facebook didn't return a code. Please try again.",
  token_exchange: "We couldn't complete the Facebook sign-in. Please retry.",
  graph_failed: "We couldn't reach Facebook. Please try again in a moment.",
  facebook_unavailable: "Facebook sign-in is not configured yet.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const errorMsg = sp.error ? ERROR_MESSAGES[sp.error] ?? sp.error : null;

  return (
    <div>
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Welcome back
        </h1>
        <p className="text-sm text-ink-600">
          Log in to your Rocketeerio account.
        </p>
      </div>

      {errorMsg && (
        <p className="mb-4 rounded-lg border border-rose/40 bg-rose/5 px-3 py-2 text-sm text-rose">
          {errorMsg}
        </p>
      )}

      <FacebookButton label="Continue with Facebook" />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-100" />
        <span className="text-xs uppercase tracking-wider text-ink-400">
          or
        </span>
        <div className="h-px flex-1 bg-ink-100" />
      </div>

      <LoginForm action={loginAction} />

      <p className="mt-6 text-center text-sm text-ink-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
