import Image from "next/image";
import { User, Zap } from "lucide-react";

export function ChatPreview() {
  return (
    <div className="relative">
      {/* Glow */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-brand-500/15 blur-3xl"
      />
      <div className="rounded-[1.75rem] border border-ink-100 bg-white p-3 shadow-2xl shadow-brand-900/10">
        <div className="rounded-2xl bg-ink-50/80 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">
                J
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Josh working Acme Roofing
                </p>
                <p className="inline-flex items-center gap-1 text-[11px] text-mint">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                  Active now · Replying instantly
                </p>
              </div>
            </div>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
              Messenger
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {/* Lead message */}
            <Bubble side="left" name="Lead">
              How much for installation? Need a quote ASAP.
            </Bubble>
            {/* Josh reply */}
            <Bubble side="right" name="Josh" isJosh timestamp="0s">
              Hi! Quotes start at $500 — depending on your roof size and pitch.
              How many units, and what city?
            </Bubble>
            {/* Lead reply */}
            <Bubble side="left" name="Lead">
              3 units. Need it done this week. Cebu City.
            </Bubble>
            {/* Typing */}
            <div className="flex items-center gap-1.5 pl-11">
              <span className="dot-1 h-2 w-2 rounded-full bg-ink-300" />
              <span className="dot-2 h-2 w-2 rounded-full bg-ink-300" />
              <span className="dot-3 h-2 w-2 rounded-full bg-ink-300" />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-amber/30 bg-amber/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-amber/20 text-amber">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">
                Hot lead alert
              </p>
              <p className="text-xs text-ink-600">
                Josh tagged this Cebu City lead as ready to buy.
              </p>
            </div>
          </div>
          <span className="hidden rounded-md bg-ink-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white sm:inline">
            Notified
          </span>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  side,
  name,
  children,
  isJosh,
  timestamp,
}: {
  side: "left" | "right";
  name: string;
  children: React.ReactNode;
  isJosh?: boolean;
  timestamp?: string;
}) {
  const right = side === "right";
  return (
    <div className={`flex items-end gap-2 ${right ? "justify-end" : ""}`}>
      {!right && (
        <span className="grid h-8 w-8 place-items-center rounded-full border border-ink-200 bg-white text-ink-500">
          <User className="h-4 w-4" />
        </span>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[0.92rem] leading-snug shadow-sm ${
          right
            ? "rounded-br-sm bg-brand-500 text-white"
            : "rounded-bl-sm border border-ink-100 bg-white text-ink-800"
        }`}
      >
        <p className={`mb-0.5 text-[10px] font-semibold uppercase tracking-wider ${right ? "text-white/80" : "text-ink-400"}`}>
          {name}{timestamp ? ` · ${timestamp}` : ""}
        </p>
        <p>{children}</p>
      </div>
      {right && isJosh && (
        <span className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-brand-50 shadow-sm">
          <Image
            src="/josh-avatar.jpg"
            alt="Josh avatar"
            fill
            sizes="32px"
            className="object-cover"
          />
        </span>
      )}
    </div>
  );
}
