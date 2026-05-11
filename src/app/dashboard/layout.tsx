import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/cookies";
import { Sidebar } from "@/components/dashboard/sidebar";
import { PageSelectionProvider } from "@/lib/page-selection-context";
import { loadDashboardConnectedPages } from "@/lib/dashboard-data";
import { logoutAction } from "../(auth)/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  const pageLoad = await loadDashboardConnectedPages(user.id);

  return (
    <PageSelectionProvider>
      <div className="flex flex-col min-h-screen bg-ink-50/40 md:flex-row">
        <Sidebar
          user={{
            name: user.name ?? null,
            email: user.email ?? null,
            avatarUrl: user.avatarUrl ?? null,
          }}
          pages={pageLoad.pages.map((page) => ({
            id: page.id,
            pageId: page.pageId,
            name: page.name,
            pictureUrl: page.pictureUrl,
            isActive: page.isActive,
          }))}
          onLogout={logoutAction}
        />
        <main className="flex-1">
          <div className="mx-auto max-w-6xl p-6 md:p-10">{children}</div>
        </main>
      </div>
    </PageSelectionProvider>
  );
}
