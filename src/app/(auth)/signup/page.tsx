import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/auth-form";
import { FacebookButton } from "@/components/auth/facebook-button";
import { signupAction } from "../actions";

export const metadata: Metadata = {
  title: "Start your free trial",
  description:
    "Create your Rocketeerio account and start qualifying Facebook leads in minutes.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <div>
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Start your free trial
        </h1>
        <p className="text-sm text-ink-600">
          14 days free. No credit card required. Cancel anytime.
        </p>
      </div>

      <FacebookButton label="Hire Josh with Facebook" />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-100" />
        <span className="text-xs uppercase tracking-wider text-ink-400">
          or
        </span>
        <div className="h-px flex-1 bg-ink-100" />
      </div>

      <SignupForm action={signupAction} />

      <p className="mt-6 text-center text-sm text-ink-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Log in
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-ink-400">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-ink-700">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-ink-700">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
