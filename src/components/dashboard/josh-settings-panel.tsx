"use client";

/*
 * Design philosophy reminder: Soft Swiss SaaS Minimalism with iOS Material controls.
 * Every control in this file should feel calm, tactile, and proportionate: rounded-2xl
 * cards, ink/brand tokens, precise Apple-style switches, compact schedules, and clear
 * save feedback without adding visual noise to the dashboard.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  Power,
  RotateCcw,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { disconnectPageAction } from "@/app/dashboard/settings/actions";
import { cn } from "@/lib/utils";

type AgentMode = "live" | "testing" | "paused";
type ResponseLength = "concise" | "balanced" | "detailed";

type ScheduleDay = {
  key: DayKey;
  label: string;
  active: boolean;
  start: string;
  end: string;
};

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type JoshSettings = {
  agentMode: AgentMode;
  businessHours: {
    alwaysOn: boolean;
    schedule: ScheduleDay[];
    afterHoursMessage: string;
  };
  responseBehavior: {
    responseDelaySeconds: number;
    maxMessagesPerConversation: number;
    responseLengthPreference: ResponseLength;
  };
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

type JoshSettingsPanelProps = {
  pageId: string | null;
  pageName: string | null;
  pagePictureUrl?: string | null;
  dbUnavailable?: boolean;
};

type RequestError = Error & { status?: number };

const DEFAULT_PAGE_ID = "106120045335034";
const DEFAULT_PAGE_NAME = "Garden Park PH";

const dayLabels: Array<{ key: DayKey; label: string }> = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const agentModes: Array<{
  value: AgentMode;
  label: string;
  description: string;
  dotClass: string;
  selectedClass: string;
}> = [
  {
    value: "live",
    label: "Live",
    description: "Josh responds to all incoming messages.",
    dotClass: "bg-emerald-500",
    selectedClass: "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-emerald-500/10",
  },
  {
    value: "testing",
    label: "Testing",
    description: "Josh replies, then marks conversations as test.",
    dotClass: "bg-amber",
    selectedClass: "border-amber/50 bg-amber/10 text-orange-800 shadow-amber/10",
  },
  {
    value: "paused",
    label: "Paused",
    description: "Josh is off and will not send responses.",
    dotClass: "bg-ink-400",
    selectedClass: "border-ink-200 bg-ink-50 text-ink-700 shadow-ink-300/10",
  },
];

const responseLengths: Array<{
  value: ResponseLength;
  label: string;
  helper: string;
}> = [
  { value: "concise", label: "Concise", helper: "Short answers" },
  { value: "balanced", label: "Balanced", helper: "Natural detail" },
  { value: "detailed", label: "Detailed", helper: "More context" },
];

const inputClass =
  "w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-900 shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 disabled:bg-ink-50 disabled:text-ink-400";

const selectClass =
  "rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm font-semibold text-ink-800 shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 disabled:bg-ink-50 disabled:text-ink-400";

function createDefaultSchedule(): ScheduleDay[] {
  return dayLabels.map(({ key, label }) => ({
    key,
    label,
    active: !["sat", "sun"].includes(key),
    start: "09:00",
    end: "18:00",
  }));
}

function createDefaultSettings(): JoshSettings {
  return {
    agentMode: "live",
    businessHours: {
      alwaysOn: true,
      schedule: createDefaultSchedule(),
      afterHoursMessage:
        "Thanks for messaging Garden Park PH. Josh is offline right now, but we received your message and will reply as soon as business hours resume.",
    },
    responseBehavior: {
      responseDelaySeconds: 2,
      maxMessagesPerConversation: 12,
      responseLengthPreference: "balanced",
    },
  };
}

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  const value = `${String(hours).padStart(2, "0")}:${minutes}`;
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const suffix = hours < 12 ? "AM" : "PM";
  return { value, label: `${hour12}:${minutes} ${suffix}` };
});

export function JoshSettingsPanel({
  pageId,
  pageName,
  pagePictureUrl,
  dbUnavailable = false,
}: JoshSettingsPanelProps) {
  const effectivePageId = pageId ?? DEFAULT_PAGE_ID;
  const effectivePageName = pageName ?? DEFAULT_PAGE_NAME;

  const [settings, setSettings] = useState<JoshSettings>(() => createDefaultSettings());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const disabledReason = useMemo(() => {
    if (dbUnavailable) return "Connected Facebook Page data could not be loaded from the database.";
    if (!effectivePageId) return "Connect a Facebook Page before saving Josh settings.";
    return null;
  }, [dbUnavailable, effectivePageId]);

  const savePayload = useMemo(
    () => ({
      scope: "josh",
      pageId: effectivePageId,
      agentMode: settings.agentMode,
      businessHours: settings.businessHours,
      responseBehavior: settings.responseBehavior,
      connectedPage: {
        pageId: effectivePageId,
        name: effectivePageName,
        receivingMessages: !disabledReason,
      },
      updatedAt: new Date().toISOString(),
    }),
    [disabledReason, effectivePageId, effectivePageName, settings],
  );

  const showToast = useCallback((nextToast: ToastState) => {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const requestJson = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const text = await response.text();
    const data = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      const error = new Error(extractErrorMessage(data) || `Request failed with ${response.status}`) as RequestError;
      error.status = response.status;
      throw error;
    }

    return data as T;
  }, []);

  const loadSettings = useCallback(async () => {
    if (!effectivePageId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const data = await requestJson<Record<string, unknown>>(
        `/api/handbook/${encodeURIComponent(effectivePageId)}/settings`,
        { method: "GET" },
      );
      setSettings(hydrateSettings(data));
    } catch (err) {
      const status = err instanceof Error && "status" in err ? (err as RequestError).status : undefined;
      if (status === 404) {
        setSettings(createDefaultSettings());
        setLoadError("No saved Josh settings were found yet. Defaults are ready to save.");
      } else {
        const message = err instanceof Error ? err.message : "Unable to load Josh settings.";
        setLoadError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [effectivePageId, requestJson]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!resetArmed) return;
    const timer = window.setTimeout(() => setResetArmed(false), 5200);
    return () => window.clearTimeout(timer);
  }, [resetArmed]);

  async function handleSave() {
    if (disabledReason) {
      showToast({ type: "error", message: disabledReason });
      return;
    }

    setSaving(true);
    try {
      await requestJson<Record<string, unknown>>(
        `/api/handbook/${encodeURIComponent(effectivePageId)}/settings`,
        {
          method: "PUT",
          body: JSON.stringify(savePayload),
        },
      );
      showToast({ type: "success", message: "Josh settings saved successfully." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save Josh settings.";
      showToast({ type: "error", message });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetJosh() {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }

    if (disabledReason) {
      showToast({ type: "error", message: disabledReason });
      return;
    }

    setResetting(true);
    try {
      await requestJson<Record<string, unknown>>(
        `/api/handbook/${encodeURIComponent(effectivePageId)}/settings`,
        {
          method: "PUT",
          body: JSON.stringify({
            ...savePayload,
            resetJosh: {
              clearConversationHistory: true,
              requestedAt: new Date().toISOString(),
            },
          }),
        },
      );
      setResetArmed(false);
      showToast({
        type: "success",
        message: "Josh reset request saved. Conversation history will be cleared by the backend.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reset Josh.";
      showToast({ type: "error", message });
    } finally {
      setResetting(false);
    }
  }

  function updateBusinessHours<T extends keyof JoshSettings["businessHours"]>(
    key: T,
    value: JoshSettings["businessHours"][T],
  ) {
    setSettings((current) => ({
      ...current,
      businessHours: {
        ...current.businessHours,
        [key]: value,
      },
    }));
  }

  function updateScheduleDay(dayKey: DayKey, updates: Partial<Omit<ScheduleDay, "key" | "label">>) {
    setSettings((current) => ({
      ...current,
      businessHours: {
        ...current.businessHours,
        schedule: current.businessHours.schedule.map((day) =>
          day.key === dayKey ? { ...day, ...updates } : day,
        ),
      },
    }));
  }

  function updateResponseBehavior<T extends keyof JoshSettings["responseBehavior"]>(
    key: T,
    value: JoshSettings["responseBehavior"][T],
  ) {
    setSettings((current) => ({
      ...current,
      responseBehavior: {
        ...current.responseBehavior,
        [key]: value,
      },
    }));
  }

  const activeMode = agentModes.find((mode) => mode.value === settings.agentMode) ?? agentModes[0];

  return (
    <div className="relative space-y-5">
      {toast ? <Toast toast={toast} /> : null}

      {loadError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-orange-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{loadError}</p>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-ink-900 via-brand-800 to-brand-600 px-5 py-5 text-white md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <Power className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Agent mode</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight">Josh is {activeMode.label}</h2>
                <p className="mt-1 text-sm leading-5 text-white/75">{activeMode.description}</p>
              </div>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-xs font-semibold ring-1 ring-white/20">
              <span className={cn("h-2.5 w-2.5 rounded-full", activeMode.dotClass)} />
              {activeMode.label} mode
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-3 md:p-5">
          {agentModes.map((mode) => {
            const selected = settings.agentMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                disabled={loading}
                onClick={() => setSettings((current) => ({ ...current, agentMode: mode.value }))}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left shadow-sm transition-all duration-200 disabled:opacity-60",
                  selected
                    ? mode.selectedClass
                    : "border-ink-100 bg-white text-ink-700 hover:border-brand-100 hover:bg-ink-50",
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <span className={cn("h-2.5 w-2.5 rounded-full", mode.dotClass)} />
                    {mode.label}
                  </span>
                  {selected ? <CheckCircle2 className="h-4 w-4" /> : null}
                </span>
                <span className="mt-2 block text-xs leading-5 opacity-80">{mode.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
        <div className="space-y-5">
          <SectionCard
            icon={Clock3}
            eyebrow="Availability"
            title="Business Hours"
            description="Choose when Josh should actively reply and what prospects hear after hours."
          >
            {loading ? (
              <LoadingBlock rows={5} />
            ) : (
              <div className="space-y-5">
                <ToggleRow
                  checked={settings.businessHours.alwaysOn}
                  onChange={(checked) => updateBusinessHours("alwaysOn", checked)}
                  label="Always on (24/7)"
                  description="Josh answers Messenger leads every day, at any time."
                />

                {!settings.businessHours.alwaysOn ? (
                  <div className="rounded-2xl border border-ink-100 bg-ink-50/70 p-3 sm:p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink-900">Weekly schedule</p>
                        <p className="mt-0.5 text-xs text-ink-500">Set an active window for each day.</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500 shadow-sm">
                        Local time
                      </span>
                    </div>
                    <div className="space-y-2">
                      {settings.businessHours.schedule.map((day) => (
                        <div
                          key={day.key}
                          className="grid items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2.5 shadow-sm sm:grid-cols-[62px_51px_minmax(0,1fr)]"
                        >
                          <p className="text-sm font-bold text-ink-800">{day.label}</p>
                          <MiniSwitch
                            checked={day.active}
                            onChange={(checked) => updateScheduleDay(day.key, { active: checked })}
                            ariaLabel={`${day.label} active`}
                          />
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                            <select
                              value={day.start}
                              disabled={!day.active}
                              onChange={(event) => updateScheduleDay(day.key, { start: event.target.value })}
                              className={selectClass}
                              aria-label={`${day.label} start time`}
                            >
                              {timeOptions.map((time) => (
                                <option key={time.value} value={time.value}>
                                  {time.label}
                                </option>
                              ))}
                            </select>
                            <span className="text-xs font-semibold text-ink-400">to</span>
                            <select
                              value={day.end}
                              disabled={!day.active}
                              onChange={(event) => updateScheduleDay(day.key, { end: event.target.value })}
                              className={selectClass}
                              aria-label={`${day.label} end time`}
                            >
                              {timeOptions.map((time) => (
                                <option key={time.value} value={time.value}>
                                  {time.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <label className="block">
                  <span className="text-sm font-semibold text-ink-900">After-hours message</span>
                  <textarea
                    value={settings.businessHours.afterHoursMessage}
                    onChange={(event) => updateBusinessHours("afterHoursMessage", event.target.value)}
                    rows={3}
                    className={cn(inputClass, "mt-2 min-h-24 resize-y leading-6")}
                    placeholder="Write the message Josh sends outside active hours."
                  />
                </label>
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={SlidersHorizontal}
            eyebrow="Reply style"
            title="Response Behavior"
            description="Tune Josh&apos;s pacing, handoff threshold, and reply detail."
          >
            {loading ? (
              <LoadingBlock rows={4} />
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-ink-900">Response delay</p>
                      <p className="mt-1 text-xs leading-5 text-ink-500">Simulated typing delay for a more natural Messenger feel.</p>
                    </div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
                      {settings.responseBehavior.responseDelaySeconds}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={settings.responseBehavior.responseDelaySeconds}
                    onChange={(event) =>
                      updateResponseBehavior("responseDelaySeconds", Number(event.target.value))
                    }
                    className="mt-4 w-full accent-brand-600"
                    aria-label="Response delay in seconds"
                  />
                  <div className="mt-1 flex justify-between text-[11px] font-semibold text-ink-400">
                    <span>Instant</span>
                    <span>10 seconds</span>
                  </div>
                </div>

                <label className="block rounded-2xl border border-ink-100 bg-white p-4 shadow-sm">
                  <span className="text-sm font-bold text-ink-900">Max messages per conversation</span>
                  <span className="mt-1 block text-xs leading-5 text-ink-500">
                    Josh automatically hands off after this many messages in one thread.
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={settings.responseBehavior.maxMessagesPerConversation}
                    onChange={(event) =>
                      updateResponseBehavior(
                        "maxMessagesPerConversation",
                        Math.max(1, Number(event.target.value || 1)),
                      )
                    }
                    className={cn(inputClass, "mt-3 max-w-40")}
                  />
                </label>

                <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm">
                  <p className="text-sm font-bold text-ink-900">Response length preference</p>
                  <p className="mt-1 text-xs leading-5 text-ink-500">Set the default answer density for Josh&apos;s replies.</p>
                  <div className="mt-4 grid rounded-full border border-ink-100 bg-ink-50 p-1 sm:grid-cols-3">
                    {responseLengths.map((option) => {
                      const selected = settings.responseBehavior.responseLengthPreference === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateResponseBehavior("responseLengthPreference", option.value)}
                          className={cn(
                            "rounded-full px-4 py-2.5 text-center text-sm font-bold transition-all duration-200",
                            selected
                              ? "bg-brand-600 text-white shadow-sm shadow-brand-500/25"
                              : "text-ink-500 hover:bg-white hover:text-ink-900",
                          )}
                        >
                          <span className="block">{option.label}</span>
                          <span className={cn("block text-[10px] font-semibold", selected ? "text-white/75" : "text-ink-400")}>
                            {option.helper}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <aside className="space-y-5">
          <SectionCard
            icon={MessageCircle}
            eyebrow="Messenger"
            title="Connected Page"
            description="Josh is currently scoped to this Facebook Page."
          >
            <div className="rounded-2xl border border-ink-100 bg-gradient-to-br from-white to-ink-50 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                {pagePictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pagePictureUrl}
                    alt=""
                    className="h-14 w-14 rounded-2xl object-cover shadow-sm ring-1 ring-ink-100"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-lg font-black text-brand-700 ring-1 ring-brand-100">
                    {effectivePageName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-ink-900">{effectivePageName}</p>
                  <p className="mt-1 truncate text-xs font-medium text-ink-500">Page ID {effectivePageId}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-ink-100 bg-white px-3 py-2.5">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-800">
                  <span className={cn("h-2.5 w-2.5 rounded-full", disabledReason ? "bg-ink-300" : "bg-mint")} />
                  {disabledReason ? "Connection needs attention" : "Receiving messages"}
                </span>
                <Wifi className={cn("h-4 w-4", disabledReason ? "text-ink-300" : "text-mint")} />
              </div>
              <p className="mt-3 text-xs leading-5 text-ink-500">
                Josh settings save through the handbook proxy for this Page, so changes follow the same page-scoped backend pattern as the Handbook tab.
              </p>
            </div>
          </SectionCard>

          <SectionCard
            icon={ShieldAlert}
            eyebrow="Danger zone"
            title="Danger Zone"
            description="Use these actions carefully. They affect Josh&apos;s operating history and Page connection."
            danger
          >
            <div className="space-y-3">
              <button
                type="button"
                disabled={resetting || loading}
                onClick={handleResetJosh}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition disabled:pointer-events-none disabled:opacity-60",
                  resetArmed
                    ? "border-rose/40 bg-rose/10 text-rose"
                    : "border-ink-100 bg-white text-ink-800 hover:border-rose/30 hover:bg-rose/5",
                )}
              >
                <span>
                  <span className="block text-sm font-bold">{resetArmed ? "Confirm reset Josh" : "Reset Josh"}</span>
                  <span className="mt-1 block text-xs leading-5 opacity-75">
                    Clears conversation history and keeps the current settings as the new baseline.
                  </span>
                </span>
                {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              </button>

              <form action={disconnectPageAction}>
                <input type="hidden" name="pageId" value={effectivePageId} />
                <button
                  type="submit"
                  disabled={!effectivePageId || dbUnavailable}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-rose/30 bg-white px-4 py-3 text-left text-rose shadow-sm transition hover:bg-rose/5 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span>
                    <span className="block text-sm font-bold">Disconnect Page</span>
                    <span className="mt-1 block text-xs leading-5 text-rose/75">
                      Removes this Facebook Page from the account connection list.
                    </span>
                  </span>
                  <Power className="h-4 w-4" />
                </button>
              </form>
            </div>
          </SectionCard>
        </aside>
      </div>

      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading || Boolean(disabledReason)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:pointer-events-none disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Josh settings"}
        </button>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  danger = false,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <section className={cn("rounded-2xl border bg-white p-5 shadow-sm", danger ? "border-rose/25" : "border-ink-100")}>
      <div className="mb-5 flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
            danger ? "bg-rose/10 text-rose" : "bg-brand-50 text-brand-700",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className={cn("text-xs font-semibold uppercase tracking-[0.18em]", danger ? "text-rose" : "text-brand-600")}>
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-ink-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-ink-600">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ToggleRow({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white p-4 text-left shadow-sm transition hover:border-brand-200 hover:bg-brand-50/30"
    >
      <span>
        <span className="block text-sm font-bold text-ink-900">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-ink-500">{description}</span>
      </span>
      <span
        className={cn(
          "relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
          checked ? "bg-brand-600" : "bg-ink-300",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-[27px] w-[27px] rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}

function MiniSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
        checked ? "bg-brand-600" : "bg-ink-300",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-[27px] w-[27px] rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

function LoadingBlock({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-2xl bg-ink-50" />
      ))}
    </div>
  );
}

function Toast({ toast }: { toast: ToastState }) {
  const success = toast.type === "success";
  return (
    <div className="fixed right-4 top-4 z-50 animate-pop-in">
      <div
        className={cn(
          "flex max-w-sm items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-sm shadow-lg",
          success ? "border-brand-100 text-brand-800" : "border-rose/30 text-rose",
        )}
      >
        {success ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
        <p className="font-semibold leading-5">{toast.message}</p>
      </div>
    </div>
  );
}

function hydrateSettings(root: Record<string, unknown>): JoshSettings {
  const defaults = createDefaultSettings();
  const source = pickSettingsSource(root);
  const businessHours = isRecord(source.businessHours) ? source.businessHours : null;
  const responseBehavior = isRecord(source.responseBehavior)
    ? source.responseBehavior
    : isRecord(source.behavior)
      ? source.behavior
      : null;

  return {
    agentMode: normalizeAgentMode(source.agentMode ?? source.mode, defaults.agentMode),
    businessHours: {
      alwaysOn: typeof businessHours?.alwaysOn === "boolean" ? businessHours.alwaysOn : defaults.businessHours.alwaysOn,
      schedule: normalizeSchedule(businessHours?.schedule, defaults.businessHours.schedule),
      afterHoursMessage:
        typeof businessHours?.afterHoursMessage === "string"
          ? businessHours.afterHoursMessage
          : defaults.businessHours.afterHoursMessage,
    },
    responseBehavior: {
      responseDelaySeconds: clampNumber(
        responseBehavior?.responseDelaySeconds ?? responseBehavior?.responseDelay,
        0,
        10,
        defaults.responseBehavior.responseDelaySeconds,
      ),
      maxMessagesPerConversation: clampNumber(
        responseBehavior?.maxMessagesPerConversation ?? responseBehavior?.maxMessages,
        1,
        99,
        defaults.responseBehavior.maxMessagesPerConversation,
      ),
      responseLengthPreference: normalizeResponseLength(
        responseBehavior?.responseLengthPreference ?? responseBehavior?.responseLength,
        defaults.responseBehavior.responseLengthPreference,
      ),
    },
  };
}

function pickSettingsSource(root: Record<string, unknown>): Record<string, unknown> {
  if (isRecord(root.settings)) return root.settings;
  if (isRecord(root.joshSettings)) return root.joshSettings;
  if (isRecord(root.data) && isRecord(root.data.settings)) return root.data.settings;
  return root;
}

function normalizeSchedule(value: unknown, fallback: ScheduleDay[]): ScheduleDay[] {
  if (!Array.isArray(value)) return fallback;
  return fallback.map((fallbackDay) => {
    const match = value.find((entry) => isRecord(entry) && entry.key === fallbackDay.key);
    if (!isRecord(match)) return fallbackDay;
    return {
      ...fallbackDay,
      active: typeof match.active === "boolean" ? match.active : fallbackDay.active,
      start: typeof match.start === "string" ? match.start : fallbackDay.start,
      end: typeof match.end === "string" ? match.end : fallbackDay.end,
    };
  });
}

function normalizeAgentMode(value: unknown, fallback: AgentMode): AgentMode {
  return value === "live" || value === "testing" || value === "paused" ? value : fallback;
}

function normalizeResponseLength(value: unknown, fallback: ResponseLength): ResponseLength {
  if (value === "concise" || value === "balanced" || value === "detailed") return value;
  if (value === "Brief") return "concise";
  if (value === "Balanced") return "balanced";
  if (value === "Detailed") return "detailed";
  return fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractErrorMessage(data: unknown): string | null {
  if (!isRecord(data)) return null;
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
