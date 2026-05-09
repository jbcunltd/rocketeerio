"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, MessageCircleHeart } from "lucide-react";
import {
  connectSinglePageAction,
  type ConnectPageState,
} from "./actions";

export interface SelectableFacebookPage {
  id: string;
  name: string;
  category: string | null;
  pictureUrl: string | null;
  alreadyConnected: boolean;
}

function ConnectButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-base font-semibold text-white shadow-sm shadow-brand-500/30 transition duration-200 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 md:h-10 md:w-auto md:min-w-28 md:rounded-lg md:text-sm"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Connecting...
        </>
      ) : (
        "Connect"
      )}
    </button>
  );
}

function PageConnectionForm({ page }: { page: SelectableFacebookPage }) {
  const [state, formAction] = useActionState<ConnectPageState, FormData>(
    connectSinglePageAction,
    undefined,
  );

  return (
    <form action={formAction} className="w-full md:w-auto">
      <input type="hidden" name="pageId" value={page.id} />
      <ConnectButton />
      {state?.ok === false && (
        <p className="mt-2 rounded-lg border border-rose/30 bg-rose/5 px-3 py-2 text-sm text-rose md:absolute md:right-0 md:top-full md:z-10 md:w-80 md:shadow-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function PageSelectionList({
  pages,
}: {
  pages: SelectableFacebookPage[];
}) {
  if (pages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-5 text-center shadow-sm md:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <MessageCircleHeart className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-ink-900">
          No Facebook Pages found
        </h2>
        <p className="mt-1 text-sm leading-6 text-ink-600">
          Make sure you are an admin of at least one Page and granted
          Rocketeerio access during Facebook authorization.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3 md:space-y-0 md:divide-y md:divide-ink-100 md:overflow-hidden md:rounded-2xl md:border md:border-ink-100 md:bg-white md:shadow-sm">
      {pages.map((page) => (
        <li
          key={page.id}
          className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-md hover:shadow-brand-500/10 md:relative md:flex md:items-center md:gap-4 md:rounded-none md:border-0 md:p-4 md:shadow-none md:hover:translate-y-0 md:hover:bg-brand-50/40 md:hover:shadow-none"
        >
          <div className="flex min-w-0 items-center gap-3 md:flex-1">
            {page.pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={page.pictureUrl}
                alt=""
                width={48}
                height={48}
                loading="lazy"
                decoding="async"
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm md:h-12 md:w-12"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-2 ring-white shadow-sm">
                <MessageCircleHeart className="h-5 w-5" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-ink-900 md:text-sm">
                {page.name}
              </h3>
              <p className="mt-0.5 truncate text-sm text-ink-500 md:text-xs">
                {page.category ?? "Facebook Page"}
                {page.alreadyConnected && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                    Already connected
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <PageConnectionForm page={page} />
          </div>
        </li>
      ))}
    </ul>
  );
}
