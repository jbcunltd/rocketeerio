"use client";

import { useActionState, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  JOSH_KNOWLEDGE_CATEGORIES,
  JOSH_MODE_OPTIONS,
  JOSH_RESPONSE_LENGTH_OPTIONS,
  JOSH_SKILL_OPTIONS,
  JOSH_TONE_OPTIONS,
  type JoshAgentSettingsValue,
} from "@/lib/josh-agent-settings";
import type {
  JoshAgentMode,
  JoshBehaviorRules,
  JoshBusinessInfo,
  JoshKnowledgeEntry,
  JoshPersonalityTone,
  JoshResponseLength,
  JoshSkillSettings,
} from "@/lib/db/schema";
import {
  saveJoshAgentSettingsAction,
  type SaveJoshSettingsState,
} from "@/app/dashboard/josh-for-sales/actions";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20";
const textareaClass = `${inputClass} min-h-28 resize-y`;
const labelClass = "text-sm font-medium text-ink-800";
const helpClass = "mt-1 text-xs leading-5 text-ink-500";

function createId(prefix = "entry") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:pointer-events-none disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Saving..." : "Save Josh settings"}
    </button>
  );
}

function StatusMessage({ state }: { state: SaveJoshSettingsState }) {
  if (!state) return null;

  if (!state.ok) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-rose/40 bg-rose/5 px-3 py-2 text-sm text-rose">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{state.error}</p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-700">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <p>Josh&apos;s settings were saved successfully.</p>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
      <div className="mb-5">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-lg font-semibold text-ink-900">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-ink-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ToggleSwitch({
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
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-ink-100 bg-white p-4 text-left transition hover:border-brand-200 hover:bg-brand-50/30"
    >
      <span>
        <span className="block text-sm font-semibold text-ink-900">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-ink-500">
          {description}
        </span>
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-brand-500" : "bg-ink-200",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

function modeAccent(mode: JoshAgentMode) {
  if (mode === "live") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (mode === "testing") return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-ink-200 bg-ink-50 text-ink-700";
}

function readAndResizeAvatar(file: File, onComplete: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxSize = 320;
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      onComplete(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = String(reader.result ?? "");
  };
  reader.readAsDataURL(file);
}

export function JoshSettingsForm({
  initialSettings,
}: {
  initialSettings: JoshAgentSettingsValue;
}) {
  const [state, formAction] = useActionState<SaveJoshSettingsState, FormData>(
    saveJoshAgentSettingsAction,
    undefined,
  );
  const [mode, setMode] = useState<JoshAgentMode>(initialSettings.mode);
  const [agentName, setAgentName] = useState(initialSettings.agentName);
  const [roleTitle, setRoleTitle] = useState(initialSettings.roleTitle);
  const [personalityTone, setPersonalityTone] = useState<JoshPersonalityTone>(
    initialSettings.personalityTone,
  );
  const [avatarUrl, setAvatarUrl] = useState(initialSettings.avatarUrl ?? "");
  const [avatarNote, setAvatarNote] = useState<string | null>(null);
  const [skills, setSkills] = useState<JoshSkillSettings>(initialSettings.skills);
  const [businessInfo, setBusinessInfo] = useState<JoshBusinessInfo>(
    initialSettings.businessInfo,
  );
  const [knowledgeBase, setKnowledgeBase] = useState<JoshKnowledgeEntry[]>(
    initialSettings.knowledgeBase,
  );
  const [behaviorRules, setBehaviorRules] = useState<JoshBehaviorRules>(
    initialSettings.behaviorRules,
  );
  const [customRuleDraft, setCustomRuleDraft] = useState("");

  const payload = useMemo(
    () =>
      JSON.stringify({
        mode,
        agentName,
        roleTitle,
        personalityTone,
        avatarUrl: avatarUrl || null,
        skills,
        businessInfo,
        knowledgeBase: knowledgeBase
          .filter((entry) => entry.title.trim() || entry.content.trim())
          .map((entry) => ({
            ...entry,
            title: entry.title.trim(),
            content: entry.content.trim(),
          })),
        behaviorRules,
      }),
    [
      mode,
      agentName,
      roleTitle,
      personalityTone,
      avatarUrl,
      skills,
      businessInfo,
      knowledgeBase,
      behaviorRules,
    ],
  );

  function updateBusinessInfo(key: keyof JoshBusinessInfo, value: string) {
    setBusinessInfo((prev) => ({ ...prev, [key]: value }));
  }

  function updateSkill(key: keyof JoshSkillSettings, value: boolean) {
    setSkills((prev) => ({ ...prev, [key]: value }));
  }

  function updateBehavior<T extends keyof JoshBehaviorRules>(
    key: T,
    value: JoshBehaviorRules[T],
  ) {
    setBehaviorRules((prev) => ({ ...prev, [key]: value }));
  }

  function addKnowledgeEntry(category: JoshKnowledgeEntry["category"] = "faqs") {
    setKnowledgeBase((prev) => [
      ...prev,
      { id: createId(), category, title: "", content: "" },
    ]);
  }

  function updateKnowledgeEntry(
    id: string,
    updates: Partial<Omit<JoshKnowledgeEntry, "id">>,
  ) {
    setKnowledgeBase((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)),
    );
  }

  function deleteKnowledgeEntry(id: string) {
    setKnowledgeBase((prev) => prev.filter((entry) => entry.id !== id));
  }

  function addCustomRule() {
    const rule = customRuleDraft.trim();
    if (!rule) return;
    setBehaviorRules((prev) => ({
      ...prev,
      customRules: [...prev.customRules, rule],
    }));
    setCustomRuleDraft("");
  }

  function deleteCustomRule(index: number) {
    setBehaviorRules((prev) => ({
      ...prev,
      customRules: prev.customRules.filter((_, i) => i !== index),
    }));
  }

  function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarNote("Please upload an image file.");
      return;
    }
    setAvatarNote("Preparing avatar preview...");
    readAndResizeAvatar(file, (dataUrl) => {
      setAvatarUrl(dataUrl);
      setAvatarNote("Avatar preview ready. Save changes to keep it.");
    });
  }

  const selectedMode = JOSH_MODE_OPTIONS.find((option) => option.value === mode);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="settings" value={payload} />

      <section className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 px-6 py-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                  Josh for Sales
                </p>
                <h2 className="text-2xl font-bold tracking-tight">
                  Agent mode is {selectedMode?.label.toLowerCase()}
                </h2>
                <p className="text-sm text-white/80">
                  Choose whether Josh is off, testing internally, or live with every lead.
                </p>
              </div>
            </div>
            <div
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-sm font-semibold",
                modeAccent(mode),
              )}
            >
              {selectedMode?.label}: {selectedMode?.description}
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {JOSH_MODE_OPTIONS.map((option) => {
            const active = option.value === mode;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                className={cn(
                  "rounded-xl border p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/60",
                  active
                    ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/15"
                    : "border-ink-100 bg-white",
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink-900">
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full",
                      option.value === "live"
                        ? "bg-emerald-500"
                        : option.value === "testing"
                          ? "bg-amber-500"
                          : "bg-ink-300",
                    )}
                  />
                </span>
                <span className="mt-1 block text-xs text-ink-500">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <SectionCard
        eyebrow="Identity"
        title="Agent Identity"
        description="Define how Josh introduces himself and how prospects experience the conversation."
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Name
              <input
                className={inputClass}
                value={agentName}
                onChange={(event) => setAgentName(event.target.value)}
                placeholder="Josh"
              />
            </label>
            <label className={labelClass}>
              Role title
              <input
                className={inputClass}
                value={roleTitle}
                onChange={(event) => setRoleTitle(event.target.value)}
                placeholder="Sales Agent"
              />
            </label>
            <label className="text-sm font-medium text-ink-800 sm:col-span-2">
              Personality/tone
              <select
                className={inputClass}
                value={personalityTone}
                onChange={(event) =>
                  setPersonalityTone(event.target.value as JoshPersonalityTone)
                }
              >
                {JOSH_TONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className={helpClass}>
                {
                  JOSH_TONE_OPTIONS.find(
                    (option) => option.value === personalityTone,
                  )?.description
                }
              </span>
            </label>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-700 ring-4 ring-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl || "/josh-avatar.jpg?v=2"}
                alt="Josh avatar preview"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            </div>
            <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50">
              <Upload className="h-4 w-4" />
              Upload photo
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarUpload}
              />
            </label>
            <input
              className="mt-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="Or paste an image URL"
            />
            <p className={helpClass}>{avatarNote ?? "Upload or paste a URL for Josh's avatar."}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Capabilities"
        title="Skills"
        description="Toggle the sales tasks Josh is allowed to perform while chatting with leads."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {JOSH_SKILL_OPTIONS.map((skill) => (
            <ToggleSwitch
              key={skill.key}
              checked={skills[skill.key]}
              onChange={(checked) => updateSkill(skill.key, checked)}
              label={skill.label}
              description={skill.description}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Knowledge"
        title="Knowledge Base"
        description="Teach Josh your business details, offers, FAQs, objections, and golden rules. Entries can be added, edited, or deleted at any time."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <label className={labelClass}>
            Company name
            <input
              className={inputClass}
              value={businessInfo.companyName}
              onChange={(event) => updateBusinessInfo("companyName", event.target.value)}
              placeholder="Rocketeerio"
            />
          </label>
          <label className="text-sm font-medium text-ink-800 lg:col-span-2">
            Business description
            <textarea
              className={textareaClass}
              value={businessInfo.description}
              onChange={(event) => updateBusinessInfo("description", event.target.value)}
              placeholder="Describe the company, target customers, sales process, and what makes the offer compelling."
            />
          </label>
          <label className="text-sm font-medium text-ink-800 lg:col-span-3">
            Products/services overview
            <textarea
              className={textareaClass}
              value={businessInfo.productsServices}
              onChange={(event) =>
                updateBusinessInfo("productsServices", event.target.value)
              }
              placeholder="Summarize the core products, services, packages, locations, inclusions, and sales priorities Josh should know."
            />
          </label>
        </div>

        <div className="mt-6 border-t border-ink-100 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">
                Editable knowledge entries
              </h3>
              <p className="text-xs text-ink-500">
                Add structured snippets for pricing, FAQs, rebuttals, golden rules, and custom notes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {JOSH_KNOWLEDGE_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => addKnowledgeEntry(category.value)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {knowledgeBase.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-6 text-center text-sm text-ink-500">
              No knowledge entries yet. Add pricing, FAQs, objection scripts, golden rules, or custom notes to guide Josh.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {knowledgeBase.map((entry, index) => {
                const selectedCategory = JOSH_KNOWLEDGE_CATEGORIES.find(
                  (category) => category.value === entry.category,
                );
                return (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-ink-100 bg-ink-50/40 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                        Entry {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => deleteKnowledgeEntry(entry.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose hover:bg-rose/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                      <label className={labelClass}>
                        Category
                        <select
                          className={inputClass}
                          value={entry.category}
                          onChange={(event) =>
                            updateKnowledgeEntry(entry.id, {
                              category: event.target
                                .value as JoshKnowledgeEntry["category"],
                            })
                          }
                        >
                          {JOSH_KNOWLEDGE_CATEGORIES.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={labelClass}>
                        Title
                        <input
                          className={inputClass}
                          value={entry.title}
                          onChange={(event) =>
                            updateKnowledgeEntry(entry.id, {
                              title: event.target.value,
                            })
                          }
                          placeholder="Example: Launch promo pricing"
                        />
                      </label>
                      <label className="text-sm font-medium text-ink-800 sm:col-span-2">
                        Content
                        <textarea
                          className={textareaClass}
                          value={entry.content}
                          onChange={(event) =>
                            updateKnowledgeEntry(entry.id, {
                              content: event.target.value,
                            })
                          }
                          placeholder={selectedCategory?.placeholder}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Guardrails"
        title="Behavior Rules"
        description="Set Josh's response style and the rules he should follow in every sales conversation."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <ToggleSwitch
            checked={behaviorRules.alwaysEndWithQuestion}
            onChange={(checked) => updateBehavior("alwaysEndWithQuestion", checked)}
            label="Always end with a question"
            description="Keep prospects engaged and move the conversation forward."
          />
          <ToggleSwitch
            checked={behaviorRules.neverMentionCompetitors}
            onChange={(checked) =>
              updateBehavior("neverMentionCompetitors", checked)
            }
            label="Never mention competitor names"
            description="Avoid naming competitors directly in responses."
          />
          <ToggleSwitch
            checked={behaviorRules.alwaysPushTowardSiteVisit}
            onChange={(checked) =>
              updateBehavior("alwaysPushTowardSiteVisit", checked)
            }
            label="Always push toward site visit"
            description="Prioritize booked visits as the main conversion goal."
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
          <label className={labelClass}>
            Response length preference
            <select
              className={inputClass}
              value={behaviorRules.responseLength}
              onChange={(event) =>
                updateBehavior(
                  "responseLength",
                  event.target.value as JoshResponseLength,
                )
              }
            >
              {JOSH_RESPONSE_LENGTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className={helpClass}>
              Short for quick Messenger replies, Detailed for consultative sales answers.
            </span>
          </label>

          <div>
            <label className={labelClass} htmlFor="custom-rule">
              Custom rules
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="custom-rule"
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
                value={customRuleDraft}
                onChange={(event) => setCustomRuleDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomRule();
                  }
                }}
                placeholder="Example: If the buyer asks for discount, ask for budget first."
              />
              <button
                type="button"
                onClick={addCustomRule}
                className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            {behaviorRules.customRules.length === 0 ? (
              <p className={helpClass}>Add multiple custom rules as free-text guardrails.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {behaviorRules.customRules.map((rule, index) => (
                  <li
                    key={`${rule}-${index}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-700"
                  >
                    <span>{rule}</span>
                    <button
                      type="button"
                      onClick={() => deleteCustomRule(index)}
                      className="shrink-0 rounded-md p-1 text-ink-400 hover:bg-white hover:text-rose"
                      aria-label="Delete custom rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SectionCard>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white/95 p-4 shadow-lg shadow-ink-900/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <StatusMessage state={state} />
        <div className="flex items-center justify-end gap-3 sm:ml-auto">
          <p className="hidden text-xs text-ink-500 sm:block">
            Changes apply after saving and can be read by the middleware later.
          </p>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
