import { AlertCircle } from "lucide-react";
import { HandbookSections } from "@/components/dashboard/handbook-sections";
import { getConnectedFacebookPage } from "@/lib/handbook-page-context";

export const dynamic = "force-dynamic";

export default async function JoshHandbookPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const selectedPageId =
    typeof searchParams.pageId === "string" ? searchParams.pageId : null;

  const { pageId, pageName, dbUnavailable } = await getConnectedFacebookPage(
    selectedPageId,
  );
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
        <div>
          <p className="text-sm font-semibold text-brand-900">Josh also inherits from the General Handbook</p>
          <p className="mt-1 text-xs leading-5 text-brand-800">
            Any knowledge, personality, or qualification criteria you add to the Company Handbook will automatically apply to Josh. These settings are Josh-specific overrides and additions.
          </p>
        </div>
      </div>

      <HandbookSections scope="josh" pageId={pageId} pageName={pageName} dbUnavailable={dbUnavailable} />
    </div>
  );
}
