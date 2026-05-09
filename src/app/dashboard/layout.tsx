import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/cookies";
import { Sidebar } from "@/components/dashboard/sidebar";
import { logoutAction } from "../(auth)/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-ink-50/40 md:flex-row">
      <Sidebar
        user={{
          name: user.name ?? null,
          email: user.email ?? null,
          avatarUrl: user.avatarUrl ?? null,
        }}
        onLogout={logoutAction}
      />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}
