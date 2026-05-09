"use client";

import { useState } from "react";
import {
  Bell,
  BookOpen,
  ChevronDown,
  Clock3,
  File,
  FileSpreadsheet,
  FileText,
  Globe,
  GripVertical,
  Image as ImageIcon,
  Link as LinkIcon,
  MessageSquareText,
  Plus,
  Settings2,
  Sparkles,
  Target,
  ToggleLeft,
  Trash2,
  UploadCloud,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type HandbookSectionsProps = {
  scope: "general" | "josh";
};

type Criterion = {
  id: string;
  label: string;
  active: boolean;
};

type Question = {
  id: string;
  value: string;
};

type Objection = {
  id: string;
  objection: string;
  response: string;
};

const acceptedSources = [
  { label: "PDF", icon: FileText },
  { label: "DOC", icon: File },
  { label: "TXT", icon: FileText },
  { label: "Images", icon: ImageIcon },
  { label: "Spreadsheets", icon: FileSpreadsheet },
];

const defaultCriteria: Criterion[] = [
  { id: "pricing", label: "Asked about pricing", active: true },
  { id: "budget", label: "Gave budget range", active: true },
  { id: "timeline", label: "Mentioned timeline", active: true },
  { id: "call", label: "Requested a call/visit", active: true },
  { id: "area", label: "Located in service area", active: true },
];

const defaultQuestions: Question[] = [
  { id: "need", value: "What are you hoping to solve or improve right now?" },
  { id: "timeline", value: "When would you like to get started?" },
  { id: "budget", value: "Do you already have a budget range in mind?" },
];

const defaultObjections: Objection[] = [
  {
    id: "price",
    objection: "Too expensive",
    response: "I understand. Would it help if I explained what is included and what options fit your budget?",
  },
  {
    id: "later",
    objection: "I need to think about it",
    response: "Of course. What information would make the decision easier for you?",
  },
];

export function HandbookSections({ scope }: HandbookSectionsProps) {
  const [responseLength, setResponseLength] = useState("Balanced");
  const [emojiEnabled, setEmojiEnabled] = useState(false);
  const [criteria, setCriteria] = useState(defaultCriteria);
  const [questions, setQuestions] = useState(defaultQuestions);
  const [objections, setObjections] = useState(defaultObjections);
  const [notificationMethod, setNotificationMethod] = useState("In-app");
  const [alerts, setAlerts] = useState({
    hotLead: true,
    human: true,
    unknown: true,
  });

  const owner = scope === "general" ? "all agents" : "Josh";
  const personalityPlaceholder =
    scope === "general"
      ? "Professional, clear, on-brand, and helpful across every customer conversation."
      : "Professional but friendly, uses Taglish for hooks, and keeps replies confident but never pushy.";

  return (
    <div className="space-y-4">
      <SectionCard
        icon={BookOpen}
        eyebrow="Knowledge source"
        title="Knowledge Base"
        description={`Upload company knowledge that ${owner} can use when answering customers.`}
        defaultOpen
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/50 p-8 text-center transition-colors hover:border-brand-300 hover:bg-brand-50">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink-900">
              Drop files here to make {scope === "general" ? "every agent" : "Josh"} smarter
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink-600">
              Accepts PDF, DOC, TXT, images, and spreadsheets. Files will appear below once uploaded and processed.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {acceptedSources.map((source) => {
                const Icon = source.icon;
                return (
                  <span
                    key={source.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1 text-xs font-semibold text-ink-500"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {source.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Add URL
              </span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-ink-100 bg-white px-3 py-2.5 focus-within:border-brand-200 focus-within:ring-2 focus-within:ring-brand-500/10">
                <LinkIcon className="h-4 w-4 text-ink-400" />
                <input
                  type="url"
                  placeholder="Paste YouTube links or website URLs"
                  className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
              </div>
            </label>

            <div className="rounded-2xl border border-ink-100 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink-900">Uploaded items</h3>
                  <p className="text-xs text-ink-500">Processing, Ready, and Failed files will show here.</p>
                </div>
                <StatusBadge status="Ready" />
              </div>
              <EmptyPanel
                icon={FileText}
                title="No knowledge files yet"
                description="Add files or URLs above to build the searchable knowledge base."
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Sparkles}
        eyebrow="Expert training"
        title="Sales Skills"
        description="Train Josh with techniques from the best sales experts."
        defaultOpen
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-2xl border border-ink-100 bg-white p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="rounded-2xl border border-ink-100 bg-ink-50 p-3 focus-within:border-brand-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/10">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                  <Youtube className="h-3.5 w-3.5" /> YouTube
                </span>
                <input
                  type="url"
                  placeholder="Paste a YouTube link (e.g., Grant Cardone closing techniques)"
                  className="mt-2 w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
              </label>
              <label className="rounded-2xl border border-ink-100 bg-ink-50 p-3 focus-within:border-brand-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/10">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                  <UploadCloud className="h-3.5 w-3.5" /> Upload
                </span>
                <input
                  type="text"
                  placeholder="Upload a sales training PDF"
                  className="mt-2 w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
              </label>
              <label className="rounded-2xl border border-ink-100 bg-ink-50 p-3 focus-within:border-brand-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/10">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                  <Globe className="h-3.5 w-3.5" /> Website
                </span>
                <input
                  type="url"
                  placeholder="Add a website URL with sales tips"
                  className="mt-2 w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
              </label>
            </div>

            <EmptyPanel
              icon={Sparkles}
              title="No skills added yet"
              description="Feed Josh sales techniques from YouTube, articles, or training materials. He&apos;ll learn and apply them in real conversations."
            />
          </div>

          <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
            <h3 className="text-sm font-semibold text-ink-900">Skill item design</h3>
            <p className="mt-1 text-xs leading-5 text-ink-500">
              Skills added here will show a source thumbnail or icon, title, AI-generated summary, status badge, activation switch, priority ranking, and delete button.
            </p>
            <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose/10 text-rose">
                  <Youtube className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">Skill title appears here</p>
                  <p className="mt-1 text-xs leading-5 text-ink-500">
                    What Josh learned: Josh will summarize key takeaways once processed.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status="Processing" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-500">
                      <ToggleLeft className="h-3.5 w-3.5" /> Active toggle
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-500">
                      <GripVertical className="h-3.5 w-3.5" /> Priority 1-5
                    </span>
                    <Trash2 className="h-4 w-4 text-ink-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={MessageSquareText}
        eyebrow="Voice system"
        title="Personality & Tone"
        description={`Define how ${owner} should sound when replying to leads.`}
        defaultOpen
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-ink-900">How should {scope === "general" ? "agents" : "Josh"} sound?</span>
              <textarea
                placeholder={personalityPlaceholder}
                defaultValue={personalityPlaceholder}
                className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm leading-6 text-ink-800 outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-500/10"
              />
            </label>

            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink-900">Response length</span>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{responseLength}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                defaultValue="1"
                onChange={(event) => setResponseLength(["Brief", "Balanced", "Detailed"][Number(event.target.value)])}
                className="mt-3 w-full accent-brand-600"
              />
              <div className="mt-1 flex justify-between text-xs font-medium text-ink-400">
                <span>Brief</span>
                <span>Balanced</span>
                <span>Detailed</span>
              </div>
            </div>

            <ToggleRow
              label="Emoji usage"
              description="Allow friendly emoji when it fits the lead and the brand voice."
              checked={emojiEnabled}
              onChange={() => setEmojiEnabled((value) => !value)}
            />
          </div>

          <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
            <h3 className="text-sm font-semibold text-ink-900">Sample response preview</h3>
            <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-ink-700 shadow-sm">
              Hi! Thanks for reaching out. I can help you check the best option based on your needs, timeline, and budget. Could you tell me what you are looking for first{emojiEnabled ? " 🙂" : "?"}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Target}
        eyebrow="Lead scoring"
        title="Qualification Criteria"
        description="Choose the signals that make a lead hot and ready for follow-up."
      >
        <div className="space-y-3">
          {criteria.map((criterion) => (
            <ToggleRow
              key={criterion.id}
              label={criterion.label}
              description={criterion.active ? "Active hot-lead signal" : "Inactive signal"}
              checked={criterion.active}
              onChange={() =>
                setCriteria((items) =>
                  items.map((item) =>
                    item.id === criterion.id ? { ...item, active: !item.active } : item,
                  ),
                )
              }
            />
          ))}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" />
            Add custom criteria
          </button>
        </div>
      </SectionCard>

      <SectionCard
        icon={Settings2}
        eyebrow="Reply paths"
        title="Conversation Flow"
        description="Shape how conversations open, qualify, handle objections, and hand off."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TextAreaField label="Opening message" placeholder="Hi! Thanks for messaging us. I'm Josh — I can help you find the best option and connect you with the team if needed." />
          <TextAreaField label="Handoff trigger message" placeholder="This looks important, so I'm looping in the boss to help you personally." />
          <TextAreaField label="Booking/closing message" placeholder="Great. What day and time works best for a quick call or visit?" />

          <div className="rounded-2xl border border-ink-100 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink-900">Qualifying questions</h3>
                <p className="text-xs text-ink-500">Sortable list, with add and remove controls.</p>
              </div>
              <button type="button" className="rounded-lg p-2 text-brand-700 hover:bg-brand-50">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {questions.map((question, index) => (
                <div key={question.id} className="flex items-center gap-2 rounded-xl border border-ink-100 bg-ink-50 px-3 py-2">
                  <GripVertical className="h-4 w-4 text-ink-300" />
                  <span className="text-xs font-semibold text-ink-400">{index + 1}</span>
                  <input
                    defaultValue={question.value}
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuestions((items) => items.filter((item) => item.id !== question.id))}
                    className="text-ink-300 hover:text-rose"
                    aria-label="Remove qualifying question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-4 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink-900">Objection handling responses</h3>
                <p className="text-xs text-ink-500">Map each objection to the response Josh should use.</p>
              </div>
              <button type="button" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {objections.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-3 md:grid-cols-[0.8fr_1.2fr_auto]">
                  <input defaultValue={item.objection} className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm text-ink-800 outline-none focus:border-brand-200" />
                  <input defaultValue={item.response} className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm text-ink-800 outline-none focus:border-brand-200" />
                  <button
                    type="button"
                    onClick={() => setObjections((items) => items.filter((entry) => entry.id !== item.id))}
                    className="inline-flex items-center justify-center rounded-xl text-ink-300 hover:bg-white hover:text-rose"
                    aria-label="Delete objection"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Bell}
        eyebrow="Human handoff"
        title="Escalation Rules"
        description="Decide when the boss should be alerted and how notifications should be sent."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <ToggleRow label="Hot lead detected" description="Alert when pricing, budget, timeline, or call intent appears." checked={alerts.hotLead} onChange={() => setAlerts((value) => ({ ...value, hotLead: !value.hotLead }))} />
            <ToggleRow label="Lead asks for human" description="Escalate when the lead asks for a person, manager, boss, or owner." checked={alerts.human} onChange={() => setAlerts((value) => ({ ...value, human: !value.human }))} />
            <ToggleRow label="Josh doesn&apos;t know answer" description="Escalate when the knowledge base cannot answer confidently." checked={alerts.unknown} onChange={() => setAlerts((value) => ({ ...value, unknown: !value.unknown }))} />
          </div>
          <div className="space-y-4 rounded-2xl border border-ink-100 bg-white p-4">
            <label className="block">
              <span className="text-sm font-semibold text-ink-900">VIP keyword detected</span>
              <input
                placeholder="owner, enterprise, urgent, partnership"
                className="mt-2 w-full rounded-xl border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-brand-200 focus:bg-white focus:ring-2 focus:ring-brand-500/10"
              />
            </label>
            <div>
              <span className="text-sm font-semibold text-ink-900">Notification method</span>
              <div className="mt-2 grid grid-cols-3 gap-2 rounded-2xl bg-ink-50 p-1">
                {["In-app", "Email", "Both"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setNotificationMethod(method)}
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                      notificationMethod === method
                        ? "bg-white text-brand-700 shadow-sm"
                        : "text-ink-500 hover:text-ink-800",
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Clock3}
        eyebrow="Memory"
        title="Learning Log"
        description={`A read-only feed of what ${owner} has learned over time.`}
      >
        <EmptyPanel
          icon={Clock3}
          title={scope === "general" ? "The General Handbook hasn&apos;t learned anything yet" : "Josh hasn&apos;t learned anything yet"}
          description="Start by adding files or taking over a conversation."
        />
      </SectionCard>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  defaultOpen = false,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm shadow-ink-100/60">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-ink-50/60"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">{eyebrow}</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-ink-900">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-600">{description}</p>
          </div>
        </div>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-ink-400 transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="border-t border-ink-100 p-5">{children}</div> : null}
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        <p className="mt-1 text-xs leading-5 text-ink-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-600" : "bg-ink-200",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}

function TextAreaField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block rounded-2xl border border-ink-100 bg-white p-4">
      <span className="text-sm font-semibold text-ink-900">{label}</span>
      <textarea
        placeholder={placeholder}
        defaultValue={placeholder}
        className="mt-2 min-h-28 w-full resize-y rounded-xl border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm leading-6 text-ink-800 outline-none focus:border-brand-200 focus:bg-white focus:ring-2 focus:ring-brand-500/10"
      />
    </label>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-ink-50 p-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ink-400 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-ink-500">{description}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "Processing" | "Ready" | "Failed" | "Active" | "Inactive" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "Processing" && "bg-amber/15 text-amber",
        status === "Ready" && "bg-brand-50 text-brand-700",
        status === "Failed" && "bg-rose/10 text-rose",
        status === "Active" && "bg-mint/10 text-emerald-700",
        status === "Inactive" && "bg-ink-100 text-ink-500",
      )}
    >
      {status}
    </span>
  );
}
