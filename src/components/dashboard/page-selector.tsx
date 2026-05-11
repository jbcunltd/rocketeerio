"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import {
  connectSelectedPagesAction,
  type ConnectPagesState,
} from "@/app/dashboard/pages/actions";

export interface AvailablePage {
  id: string;
  name: string;
  category: string | null;
  pictureUrl: string | null;
  alreadyConnected: boolean;
}

function ConnectButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || count === 0}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:pointer-events-none disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>Connect{count > 0 ? ` (${count})` : ""}</>
      )}
    </button>
  );
}

export function PageSelector({ pages }: { pages: AvailablePage[] }) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(pages.filter((p) => p.alreadyConnected).map((p) => p.id)),
  );
  const [state, formAction] = useActionState<ConnectPagesState, FormData>(
    connectSelectedPagesAction,
    undefined,
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (pages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
        We couldn&apos;t find any Pages on your Facebook account. Make sure
        you&apos;re an admin of at least one Page and grant Rocketeerio access.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <ul className="divide-y divide-ink-100 rounded-lg border border-ink-200">
        {pages.map((page) => {
          const isSelected = selected.has(page.id);
          return (
            <li key={page.id} className="flex items-center gap-3 p-3">
              <input
                type="checkbox"
                name="pageIds"
                value={page.id}
                checked={isSelected}
                onChange={() => toggle(page.id)}
                className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
              />
              <div className="flex flex-1 items-center gap-3">
                {page.pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={page.pictureUrl}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    decoding="async"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-ink-100" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink-900">
                    {page.name}
                  </div>
                  <div className="truncate text-xs text-ink-500">
                    {page.category ?? "Facebook Page"}
                    {page.alreadyConnected && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                        Connected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {state && !state.ok && (
        <p className="rounded-lg border border-rose/40 bg-rose/5 px-3 py-2 text-sm text-rose">
          {state.error}
        </p>
      )}
      {state && state.ok && (
        <p className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-700">
          Connected {state.connected} page{state.connected === 1 ? "" : "s"}.
        </p>
      )}
      <div className="flex items-center justify-end">
        <ConnectButton count={selected.size} />
      </div>
    </form>
  );
}
