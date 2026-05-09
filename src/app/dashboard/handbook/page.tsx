import { BookOpen, Folder } from "lucide-react";
import { HandbookSections } from "@/components/dashboard/handbook-sections";

export const dynamic = "force-dynamic";

type HandbookFolder = {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  lastUpdated: string;
  isClickable: boolean;
};

const folders: HandbookFolder[] = [
  {
    id: "general",
    name: "General",
    description: "Company-wide knowledge that all agents inherit: brand voice, product info, pricing, FAQs.",
    itemCount: 0,
    lastUpdated: "Never",
    isClickable: true,
  },
  {
    id: "josh",
    name: "Josh for Sales",
    description: "Josh's specific handbook with sales techniques and conversation flows.",
    itemCount: 0,
    lastUpdated: "Never",
    isClickable: true,
  },
];

export default function CompanyHandbookPage() {
  return (
    <div className="space-y-8">
      <header>
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 shadow-sm">
          <BookOpen className="h-3.5 w-3.5" />
          Company handbook
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
          Company Handbook
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">
          Manage knowledge bases and playbooks for your entire team. Each agent inherits from the General Handbook and can have specialized knowledge.
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Handbook folders</h2>
          <p className="mt-1 text-sm text-ink-600">Click a folder to view or edit its contents.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className="group rounded-3xl border border-ink-100 bg-white p-6 text-left shadow-sm transition-all hover:border-brand-200 hover:shadow-md hover:shadow-brand-500/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100">
                  <Folder className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-500">
                  {folder.itemCount} items
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-ink-900">{folder.name}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-600">{folder.description}</p>

              <div className="mt-4 flex items-center justify-between pt-4 border-t border-ink-100">
                <span className="text-xs text-ink-400">Last updated: {folder.lastUpdated}</span>
                <span className="text-xs font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Open →
                </span>
              </div>
            </button>
          ))}

          <div className="rounded-3xl border border-dashed border-ink-200 bg-ink-50 p-6 flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink-400">
              <Folder className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-ink-900">Add more agents</h3>
            <p className="mt-2 text-xs leading-5 text-ink-500">
              As you add new agents to your team, their handbooks will appear here.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">General Handbook</h2>
          <p className="mt-1 text-sm text-ink-600">
            Knowledge and playbooks that all agents inherit. Edit these settings to affect every agent on your team.
          </p>
        </div>
        <HandbookSections scope="general" />
      </section>
    </div>
  );
}
