import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getCurrentSession } from "@/lib/auth/cookies";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getCurrentSession();
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-500 lg:block">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(40rem_25rem_at_30%_20%,rgba(255,255,255,0.18),transparent)]"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full bg-brand-700/40 blur-3xl"
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo className="[&_span:last-child]:text-white" />
          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight">
              The fastest way to qualify Facebook leads.
            </h2>
            <p className="max-w-md text-white/85">
              Connect your Facebook Pages, drop in your playbook, and let
              Josh handle the rest — from first reply to booked call.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>• Auto-reply in under 60 seconds</li>
              <li>• AI-powered lead qualification</li>
              <li>• Hot-lead alerts to your phone</li>
            </ul>
          </div>
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Rocketeerio
          </p>
        </div>
      </div>
      {/* Form panel */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
