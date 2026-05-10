"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  File,
  FileSpreadsheet,
  FileText,
  Globe,
  GripVertical,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  MessageSquareText,
  Plus,
  Save,
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
  pageId: string | null;
  pageName?: string | null;
  dbUnavailable?: boolean;
};

type Criterion = {
  id: string;
  label: string;
  active: boolean;
  custom?: boolean;
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

type KnowledgeItem = {
  id: string;
  type: "file" | "url" | "youtube" | string;
  title: string;
  url?: string;
  fileName?: string;
  status: HandbookStatus;
  createdAt?: string;
};

type SkillItem = {
  id: string;
  type: "file" | "url" | "youtube" | string;
  title: string;
  url?: string;
  fileName?: string;
  summary?: string;
  status: HandbookStatus;
  active: boolean;
  priority: number;
  createdAt?: string;
};

type HandbookStatus = "Processing" | "Ready" | "Failed" | "Active" | "Inactive";

type PersonalitySettings = {
  instructions: string;
  responseLength: "Brief" | "Balanced" | "Detailed";
  emojiEnabled: boolean;
};

type QualificationSettings = {
  criteria: Criterion[];
};

type FlowSettings = {
  openingMessage: string;
  handoffTriggerMessage: string;
  bookingClosingMessage: string;
  qualifyingQuestions: Question[];
  objections: Objection[];
};

type EscalationSettings = {
  alerts: {
    hotLead: boolean;
    human: boolean;
    unknown: boolean;
  };
  vipKeywords: string;
  notificationMethod: "In-app" | "Email" | "Both";
};

type LearningEvent = {
  id: string;
  title: string;
  description?: string;
  createdAt?: string;
  type?: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

type SaveKey = "personality" | "qualification" | "flow" | "escalation" | "knowledge" | "skills";

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

const responseLengthValues = ["Brief", "Balanced", "Detailed"] as const;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function HandbookSections({ scope, pageId, pageName, dbUnavailable = false }: HandbookSectionsProps) {
  const owner = scope === "general" ? "all agents" : "Josh";
  const personalityPlaceholder =
    scope === "general"
      ? "Professional, clear, on-brand, and helpful across every customer conversation."
      : "Professional but friendly, uses Taglish for hooks, and keeps replies confident but never pushy.";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [urlValue, setUrlValue] = useState("");
  const [skillYoutubeUrl, setSkillYoutubeUrl] = useState("");
  const [skillWebsiteUrl, setSkillWebsiteUrl] = useState("");
  const [customCriterion, setCustomCriterion] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newObjection, setNewObjection] = useState({ objection: "", response: "" });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const skillFileInputRef = useRef<HTMLInputElement | null>(null);

  const [personality, setPersonality] = useState<PersonalitySettings>({
    instructions: personalityPlaceholder,
    responseLength: "Balanced",
    emojiEnabled: false,
  });
  const [qualification, setQualification] = useState<QualificationSettings>({ criteria: defaultCriteria });
  const [flow, setFlow] = useState<FlowSettings>({
    openingMessage: "Hi! Thanks for messaging us. I'm Josh — I can help you find the best option and connect you with the team if needed.",
    handoffTriggerMessage: "This looks important, so I'm looping in the boss to help you personally.",
    bookingClosingMessage: "Great. What day and time works best for a quick call or visit?",
    qualifyingQuestions: defaultQuestions,
    objections: defaultObjections,
  });
  const [escalation, setEscalation] = useState<EscalationSettings>({
    alerts: {
      hotLead: true,
      human: true,
      unknown: true,
    },
    vipKeywords: "owner, enterprise, urgent, partnership",
    notificationMethod: "In-app",
  });
  const [learningEvents, setLearningEvents] = useState<LearningEvent[]>([]);

  const disabledReason = useMemo(() => {
    if (dbUnavailable) return "The app could not load connected Facebook Page data from the database.";
    if (!pageId) return "Connect a Facebook Page first so this handbook has a page scope to save against.";
    return null;
  }, [dbUnavailable, pageId]);

  const showToast = useCallback((nextToast: ToastState) => {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const setSavingKey = useCallback((key: SaveKey, value: boolean) => {
    setSaving((current) => ({ ...current, [key]: value }));
  }, []);

  const requestJson = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
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
        const message = extractErrorMessage(data) || `Request failed with ${response.status}`;
        throw new Error(message);
      }
      return data as T;
    },
    [],
  );

  const loadHandbook = useCallback(async () => {
    if (!pageId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const data = await requestJson<Record<string, unknown>>(`/api/handbook/${encodeURIComponent(pageId)}`, {
        method: "GET",
      });
      hydrateFromPayload(data, {
        personalityPlaceholder,
        setKnowledgeItems,
        setSkills,
        setPersonality,
        setQualification,
        setFlow,
        setEscalation,
        setLearningEvents,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load handbook settings.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [pageId, personalityPlaceholder, requestJson]);

  useEffect(() => {
    void loadHandbook();
  }, [loadHandbook]);

  async function saveSection<TPayload>(key: SaveKey, endpoint: string, payload: TPayload, successMessage = "Saved!") {
    if (!pageId || disabledReason) {
      showToast({ type: "error", message: disabledReason ?? "No handbook scope is available." });
      return null;
    }

    setSavingKey(key, true);
    try {
      const data = await requestJson<Record<string, unknown>>(`/api/handbook/${encodeURIComponent(pageId)}/${endpoint}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast({ type: "success", message: successMessage });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save changes.";
      showToast({ type: "error", message });
      return null;
    } finally {
      setSavingKey(key, false);
    }
  }

  async function addKnowledgeFromUrl() {
    const url = urlValue.trim();
    if (!url) return;
    const type = isYoutubeUrl(url) ? "youtube" : "url";
    await addKnowledgeItem({
      type,
      url,
      title: url,
      source: url,
    });
    setUrlValue("");
  }

  async function addKnowledgeItem(payload: Record<string, unknown>) {
    if (!pageId || disabledReason) {
      showToast({ type: "error", message: disabledReason ?? "No handbook scope is available." });
      return;
    }
    setSavingKey("knowledge", true);
    try {
      await requestJson<Record<string, unknown>>(`/api/handbook/${encodeURIComponent(pageId)}/knowledge`, {
        method: "POST",
        body: JSON.stringify({ scope, ...payload }),
      });
      showToast({ type: "success", message: "Saved!" });
      await loadHandbook();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to add knowledge item.";
      showToast({ type: "error", message });
    } finally {
      setSavingKey("knowledge", false);
    }
  }

  async function deleteKnowledgeItem(id: string) {
    if (!pageId) return;
    setSavingKey("knowledge", true);
    try {
      await requestJson<Record<string, unknown>>(
        `/api/handbook/${encodeURIComponent(pageId)}/knowledge/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      setKnowledgeItems((items) => items.filter((item) => item.id !== id));
      showToast({ type: "success", message: "Deleted." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete knowledge item.";
      showToast({ type: "error", message });
    } finally {
      setSavingKey("knowledge", false);
    }
  }

  async function addSkill(payload: Record<string, unknown>) {
    if (!pageId || disabledReason) {
      showToast({ type: "error", message: disabledReason ?? "No handbook scope is available." });
      return;
    }
    setSavingKey("skills", true);
    try {
      await requestJson<Record<string, unknown>>(`/api/handbook/${encodeURIComponent(pageId)}/skills`, {
        method: "POST",
        body: JSON.stringify({ scope, priority: skills.length + 1, active: true, ...payload }),
      });
      showToast({ type: "success", message: "Saved!" });
      await loadHandbook();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to add skill.";
      showToast({ type: "error", message });
    } finally {
      setSavingKey("skills", false);
    }
  }

  async function updateSkill(nextSkill: SkillItem, successMessage = "Saved!") {
    if (!pageId) return;
    setSavingKey("skills", true);
    try {
      await requestJson<Record<string, unknown>>(`/api/handbook/${encodeURIComponent(pageId)}/skills`, {
        method: "POST",
        body: JSON.stringify({ scope, action: "update", ...nextSkill }),
      });
      setSkills((items) => items.map((item) => (item.id === nextSkill.id ? nextSkill : item)));
      showToast({ type: "success", message: successMessage });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update skill.";
      showToast({ type: "error", message });
    } finally {
      setSavingKey("skills", false);
    }
  }

  async function deleteSkill(id: string) {
    if (!pageId) return;
    setSavingKey("skills", true);
    try {
      await requestJson<Record<string, unknown>>(
        `/api/handbook/${encodeURIComponent(pageId)}/skills/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const remaining = skills.filter((skill) => skill.id !== id).map((skill, index) => ({ ...skill, priority: index + 1 }));
      setSkills(remaining);
      showToast({ type: "success", message: "Deleted." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete skill.";
      showToast({ type: "error", message });
    } finally {
      setSavingKey("skills", false);
    }
  }

  async function moveSkill(id: string, direction: -1 | 1) {
    const currentIndex = skills.findIndex((skill) => skill.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= skills.length || !pageId) return;

    const reordered = [...skills];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, moved);
    const withPriority = reordered.map((skill, index) => ({ ...skill, priority: index + 1 }));
    setSkills(withPriority);
    setSavingKey("skills", true);
    try {
      await requestJson<Record<string, unknown>>(`/api/handbook/${encodeURIComponent(pageId)}/skills`, {
        method: "POST",
        body: JSON.stringify({ scope, action: "reorder", skills: withPriority }),
      });
      showToast({ type: "success", message: "Priority saved." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save skill order.";
      showToast({ type: "error", message });
      await loadHandbook();
    } finally {
      setSavingKey("skills", false);
    }
  }

  async function handleKnowledgeFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const payload = await buildFilePayload(file);
      if (!payload) continue;
      await addKnowledgeItem(payload);
    }
  }

  async function handleSkillFile(file: File | undefined) {
    if (!file) return;
    const payload = await buildFilePayload(file);
    if (!payload) return;
    await addSkill(payload);
  }

  async function buildFilePayload(file: File) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast({ type: "error", message: `${file.name} is too large. Please upload files up to 10 MB.` });
      return null;
    }
    const content = await readFileAsDataUrl(file);
    return {
      type: "file",
      title: file.name,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      content,
    };
  }

  const savePersonality = () =>
    saveSection("personality", "personality", {
      scope,
      instructions: personality.instructions,
      responseLength: personality.responseLength,
      emojiEnabled: personality.emojiEnabled,
    });

  const saveQualification = (nextQualification = qualification) =>
    saveSection("qualification", "qualification", {
      scope,
      criteria: nextQualification.criteria,
    });

  const saveFlow = (nextFlow = flow) =>
    saveSection("flow", "flow", {
      scope,
      openingMessage: nextFlow.openingMessage,
      handoffTriggerMessage: nextFlow.handoffTriggerMessage,
      bookingClosingMessage: nextFlow.bookingClosingMessage,
      qualifyingQuestions: nextFlow.qualifyingQuestions,
      objections: nextFlow.objections,
    });

  const saveEscalation = (nextEscalation = escalation) =>
    saveSection("escalation", "escalation", {
      scope,
      alerts: nextEscalation.alerts,
      vipKeywords: nextEscalation.vipKeywords,
      notificationMethod: nextEscalation.notificationMethod,
    });

  function toggleCriterion(id: string) {
    const next = {
      criteria: qualification.criteria.map((criterion) =>
        criterion.id === id ? { ...criterion, active: !criterion.active } : criterion,
      ),
    };
    setQualification(next);
    void saveQualification(next);
  }

  function addCustomCriterion() {
    const label = customCriterion.trim();
    if (!label) return;
    const next = {
      criteria: [...qualification.criteria, { id: makeId("criteria"), label, active: true, custom: true }],
    };
    setQualification(next);
    setCustomCriterion("");
    void saveQualification(next);
  }

  function removeCriterion(id: string) {
    const next = { criteria: qualification.criteria.filter((criterion) => criterion.id !== id) };
    setQualification(next);
    void saveQualification(next);
  }

  function updateQuestion(id: string, value: string) {
    setFlow((current) => ({
      ...current,
      qualifyingQuestions: current.qualifyingQuestions.map((question) => (question.id === id ? { ...question, value } : question)),
    }));
  }

  function addQuestion() {
    const value = newQuestion.trim();
    if (!value) return;
    const next = { ...flow, qualifyingQuestions: [...flow.qualifyingQuestions, { id: makeId("question"), value }] };
    setFlow(next);
    setNewQuestion("");
    void saveFlow(next);
  }

  function removeQuestion(id: string) {
    const next = { ...flow, qualifyingQuestions: flow.qualifyingQuestions.filter((question) => question.id !== id) };
    setFlow(next);
    void saveFlow(next);
  }

  function moveQuestion(id: string, direction: -1 | 1) {
    const currentIndex = flow.qualifyingQuestions.findIndex((question) => question.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= flow.qualifyingQuestions.length) return;
    const questions = [...flow.qualifyingQuestions];
    const [moved] = questions.splice(currentIndex, 1);
    questions.splice(nextIndex, 0, moved);
    const next = { ...flow, qualifyingQuestions: questions };
    setFlow(next);
    void saveFlow(next);
  }

  function updateObjection(id: string, field: "objection" | "response", value: string) {
    setFlow((current) => ({
      ...current,
      objections: current.objections.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  }

  function addObjection() {
    const objection = newObjection.objection.trim();
    const response = newObjection.response.trim();
    if (!objection || !response) return;
    const next = { ...flow, objections: [...flow.objections, { id: makeId("objection"), objection, response }] };
    setFlow(next);
    setNewObjection({ objection: "", response: "" });
    void saveFlow(next);
  }

  function removeObjection(id: string) {
    const next = { ...flow, objections: flow.objections.filter((item) => item.id !== id) };
    setFlow(next);
    void saveFlow(next);
  }

  if (loading) {
    return <HandbookSkeleton />;
  }

  return (
    <div className="relative space-y-4">
      {toast ? <Toast toast={toast} /> : null}
      {disabledReason ? (
        <InlineAlert
          tone="warning"
          title="Handbook saving is paused"
          description={disabledReason}
        />
      ) : null}
      {loadError ? (
        <InlineAlert
          tone="error"
          title="Could not load handbook data"
          description={`${loadError} You can retry loading, and all save buttons will show errors if the backend is unavailable.`}
          action={<button type="button" onClick={() => void loadHandbook()} className="text-xs font-semibold text-rose underline">Retry</button>}
        />
      ) : null}
      {pageName && scope === "josh" ? (
        <p className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Editing Josh&apos;s Handbook for <span className="font-semibold">{pageName}</span>.
        </p>
      ) : null}

      <SectionCard
        icon={BookOpen}
        eyebrow="Knowledge source"
        title="Knowledge Base"
        description={`Upload company knowledge that ${owner} can use when answering customers.`}
        defaultOpen
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <button
            type="button"
            disabled={Boolean(disabledReason) || saving.knowledge}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void handleKnowledgeFiles(event.dataTransfer.files);
            }}
            className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/50 p-8 text-center transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,image/*"
              onChange={(event) => {
                if (event.target.files) void handleKnowledgeFiles(event.target.files);
                event.currentTarget.value = "";
              }}
            />
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm">
              {saving.knowledge ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink-900">
              Drop files here to make {scope === "general" ? "every agent" : "Josh"} smarter
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink-600">
              Accepts PDF, DOC, TXT, images, and spreadsheets. Files are sent to the handbook API and appear below with their backend status.
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
          </button>

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Add URL or YouTube link
              </span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-ink-100 bg-white px-3 py-2.5 focus-within:border-brand-200 focus-within:ring-2 focus-within:ring-brand-500/10">
                <LinkIcon className="h-4 w-4 text-ink-400" />
                <input
                  type="url"
                  value={urlValue}
                  onChange={(event) => setUrlValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void addKnowledgeFromUrl();
                    }
                  }}
                  placeholder="Paste YouTube links or website URLs"
                  className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
                <button
                  type="button"
                  disabled={!urlValue.trim() || Boolean(disabledReason) || saving.knowledge}
                  onClick={() => void addKnowledgeFromUrl()}
                  className="rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </label>

            <div className="rounded-2xl border border-ink-100 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink-900">Uploaded items</h3>
                  <p className="text-xs text-ink-500">Processing, Ready, and Failed files are loaded from the backend.</p>
                </div>
                <StatusBadge status={knowledgeItems.length ? "Ready" : "Inactive"} />
              </div>
              {knowledgeItems.length === 0 ? (
                <EmptyPanel
                  icon={FileText}
                  title="No knowledge files yet"
                  description="Add files or URLs above to build the searchable knowledge base."
                />
              ) : (
                <div className="mt-4 space-y-2">
                  {knowledgeItems.map((item) => (
                    <SourceItemRow
                      key={item.id}
                      title={item.title}
                      subtitle={item.url || item.fileName || item.type}
                      icon={item.type === "youtube" ? Youtube : item.type === "url" ? Globe : FileText}
                      status={item.status}
                      onDelete={() => void deleteKnowledgeItem(item.id)}
                      disabled={saving.knowledge}
                    />
                  ))}
                </div>
              )}
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
                <div className="mt-2 flex gap-2">
                  <input
                    type="url"
                    value={skillYoutubeUrl}
                    onChange={(event) => setSkillYoutubeUrl(event.target.value)}
                    placeholder="Paste a YouTube link"
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                  />
                  <button
                    type="button"
                    disabled={!skillYoutubeUrl.trim() || saving.skills}
                    onClick={() => {
                      const url = skillYoutubeUrl.trim();
                      setSkillYoutubeUrl("");
                      void addSkill({ type: "youtube", url, title: url, source: url });
                    }}
                    className="text-xs font-semibold text-brand-700 disabled:text-ink-300"
                  >
                    Add
                  </button>
                </div>
              </label>
              <label className="rounded-2xl border border-ink-100 bg-ink-50 p-3 focus-within:border-brand-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/10">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                  <UploadCloud className="h-3.5 w-3.5" /> Upload
                </span>
                <input
                  ref={skillFileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,image/*"
                  onChange={(event) => {
                    void handleSkillFile(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                <button
                  type="button"
                  disabled={Boolean(disabledReason) || saving.skills}
                  onClick={() => skillFileInputRef.current?.click()}
                  className="mt-2 w-full truncate text-left text-sm text-ink-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-ink-300"
                >
                  Upload a sales training file
                </button>
              </label>
              <label className="rounded-2xl border border-ink-100 bg-ink-50 p-3 focus-within:border-brand-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/10">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                  <Globe className="h-3.5 w-3.5" /> Website
                </span>
                <div className="mt-2 flex gap-2">
                  <input
                    type="url"
                    value={skillWebsiteUrl}
                    onChange={(event) => setSkillWebsiteUrl(event.target.value)}
                    placeholder="Add a website URL"
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                  />
                  <button
                    type="button"
                    disabled={!skillWebsiteUrl.trim() || saving.skills}
                    onClick={() => {
                      const url = skillWebsiteUrl.trim();
                      setSkillWebsiteUrl("");
                      void addSkill({ type: isYoutubeUrl(url) ? "youtube" : "url", url, title: url, source: url });
                    }}
                    className="text-xs font-semibold text-brand-700 disabled:text-ink-300"
                  >
                    Add
                  </button>
                </div>
              </label>
            </div>

            {skills.length === 0 ? (
              <EmptyPanel
                icon={Sparkles}
                title="No skills added yet"
                description="Feed Josh sales techniques from YouTube, articles, or training materials. He&apos;ll learn and apply them in real conversations."
              />
            ) : (
              <div className="mt-4 space-y-3">
                {skills.map((skill, index) => (
                  <div key={skill.id} className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose/10 text-rose">
                        {skill.type === "youtube" ? <Youtube className="h-5 w-5" /> : skill.type === "url" ? <Globe className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">{skill.title}</p>
                        <p className="mt-1 text-xs leading-5 text-ink-500">{skill.summary || skill.url || skill.fileName || "Waiting for backend summary."}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <StatusBadge status={skill.status} />
                          <button
                            type="button"
                            onClick={() => void updateSkill({ ...skill, active: !skill.active }, "Saved!")}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink-600 hover:text-brand-700"
                          >
                            <ToggleLeft className="h-3.5 w-3.5" /> {skill.active ? "Active" : "Inactive"}
                          </button>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink-500">
                            Priority {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" disabled={index === 0 || saving.skills} onClick={() => void moveSkill(skill.id, -1)} className="rounded-lg px-2 py-1 text-xs font-semibold text-ink-500 hover:bg-white disabled:opacity-30">Up</button>
                        <button type="button" disabled={index === skills.length - 1 || saving.skills} onClick={() => void moveSkill(skill.id, 1)} className="rounded-lg px-2 py-1 text-xs font-semibold text-ink-500 hover:bg-white disabled:opacity-30">Down</button>
                        <button type="button" disabled={saving.skills} onClick={() => void deleteSkill(skill.id)} className="rounded-lg p-2 text-ink-300 hover:bg-white hover:text-rose" aria-label="Delete skill">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
            <h3 className="text-sm font-semibold text-ink-900">Skill controls</h3>
            <p className="mt-1 text-xs leading-5 text-ink-500">
              Skills are loaded from the backend, can be activated or deactivated, deleted, and reordered. Priority changes are saved immediately.
            </p>
            <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-4 text-xs leading-5 text-ink-500">
              {saving.skills ? "Saving skills…" : `${skills.length} skill${skills.length === 1 ? "" : "s"} in this handbook.`}
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
                value={personality.instructions}
                onChange={(event) => setPersonality((current) => ({ ...current, instructions: event.target.value }))}
                onBlur={() => void savePersonality()}
                className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm leading-6 text-ink-800 outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-500/10"
              />
            </label>

            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink-900">Response length</span>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{personality.responseLength}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                value={responseLengthValues.indexOf(personality.responseLength)}
                onChange={(event) => {
                  const next = { ...personality, responseLength: responseLengthValues[Number(event.target.value)] };
                  setPersonality(next);
                }}
                onMouseUp={() => void savePersonality()}
                onTouchEnd={() => void savePersonality()}
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
              checked={personality.emojiEnabled}
              onChange={() => {
                const next = { ...personality, emojiEnabled: !personality.emojiEnabled };
                setPersonality(next);
                void saveSection("personality", "personality", { scope, ...next });
              }}
            />
            <SaveButton saving={saving.personality} onClick={() => void savePersonality()} />
          </div>

          <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
            <h3 className="text-sm font-semibold text-ink-900">Sample response preview</h3>
            <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-ink-700 shadow-sm">
              Hi! Thanks for reaching out. I can help you check the best option based on your needs, timeline, and budget. Could you tell me what you are looking for first{personality.emojiEnabled ? " 🙂" : "?"}
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
          {qualification.criteria.map((criterion) => (
            <div key={criterion.id} className="flex items-center gap-2">
              <div className="flex-1">
                <ToggleRow
                  label={criterion.label}
                  description={criterion.active ? "Active hot-lead signal" : "Inactive signal"}
                  checked={criterion.active}
                  onChange={() => toggleCriterion(criterion.id)}
                />
              </div>
              {criterion.custom ? (
                <button type="button" onClick={() => removeCriterion(criterion.id)} className="rounded-xl p-3 text-ink-300 hover:bg-white hover:text-rose" aria-label="Remove custom criterion">
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
          <div className="flex flex-col gap-2 rounded-2xl border border-ink-100 bg-ink-50 p-3 sm:flex-row">
            <input
              value={customCriterion}
              onChange={(event) => setCustomCriterion(event.target.value)}
              placeholder="Add a custom qualification signal"
              className="min-w-0 flex-1 rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm text-ink-800 outline-none focus:border-brand-200"
            />
            <button
              type="button"
              onClick={addCustomCriterion}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-100 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"
            >
              <Plus className="h-4 w-4" />
              Add custom criteria
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Settings2}
        eyebrow="Reply paths"
        title="Conversation Flow"
        description="Shape how conversations open, qualify, handle objections, and hand off."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TextAreaField label="Opening message" value={flow.openingMessage} onChange={(value) => setFlow((current) => ({ ...current, openingMessage: value }))} onBlur={() => void saveFlow()} />
          <TextAreaField label="Handoff trigger message" value={flow.handoffTriggerMessage} onChange={(value) => setFlow((current) => ({ ...current, handoffTriggerMessage: value }))} onBlur={() => void saveFlow()} />
          <TextAreaField label="Booking/closing message" value={flow.bookingClosingMessage} onChange={(value) => setFlow((current) => ({ ...current, bookingClosingMessage: value }))} onBlur={() => void saveFlow()} />

          <div className="rounded-2xl border border-ink-100 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink-900">Qualifying questions</h3>
                <p className="text-xs text-ink-500">Sortable list, with add and remove controls.</p>
              </div>
              <SaveButton saving={saving.flow} onClick={() => void saveFlow()} compact />
            </div>
            <div className="mt-4 space-y-2">
              {flow.qualifyingQuestions.map((question, index) => (
                <div key={question.id} className="flex items-center gap-2 rounded-xl border border-ink-100 bg-ink-50 px-3 py-2">
                  <GripVertical className="h-4 w-4 text-ink-300" />
                  <span className="text-xs font-semibold text-ink-400">{index + 1}</span>
                  <input
                    value={question.value}
                    onChange={(event) => updateQuestion(question.id, event.target.value)}
                    onBlur={() => void saveFlow()}
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink-800 outline-none"
                  />
                  <button type="button" disabled={index === 0} onClick={() => moveQuestion(question.id, -1)} className="text-xs font-semibold text-ink-400 hover:text-brand-700 disabled:opacity-30">Up</button>
                  <button type="button" disabled={index === flow.qualifyingQuestions.length - 1} onClick={() => moveQuestion(question.id, 1)} className="text-xs font-semibold text-ink-400 hover:text-brand-700 disabled:opacity-30">Down</button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="text-ink-300 hover:text-rose"
                    aria-label="Remove qualifying question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 rounded-xl border border-dashed border-ink-200 bg-white px-3 py-2">
                <input value={newQuestion} onChange={(event) => setNewQuestion(event.target.value)} placeholder="Add another qualifying question" className="min-w-0 flex-1 text-sm outline-none" />
                <button type="button" onClick={addQuestion} className="text-xs font-semibold text-brand-700">Add</button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-4 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink-900">Objection handling responses</h3>
                <p className="text-xs text-ink-500">Map each objection to the response Josh should use.</p>
              </div>
              <SaveButton saving={saving.flow} onClick={() => void saveFlow()} compact />
            </div>
            <div className="mt-4 space-y-3">
              {flow.objections.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-3 md:grid-cols-[0.8fr_1.2fr_auto]">
                  <input value={item.objection} onChange={(event) => updateObjection(item.id, "objection", event.target.value)} onBlur={() => void saveFlow()} className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm text-ink-800 outline-none focus:border-brand-200" />
                  <input value={item.response} onChange={(event) => updateObjection(item.id, "response", event.target.value)} onBlur={() => void saveFlow()} className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm text-ink-800 outline-none focus:border-brand-200" />
                  <button
                    type="button"
                    onClick={() => removeObjection(item.id)}
                    className="inline-flex items-center justify-center rounded-xl text-ink-300 hover:bg-white hover:text-rose"
                    aria-label="Delete objection"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="grid gap-3 rounded-2xl border border-dashed border-ink-200 bg-white p-3 md:grid-cols-[0.8fr_1.2fr_auto]">
                <input value={newObjection.objection} onChange={(event) => setNewObjection((current) => ({ ...current, objection: event.target.value }))} placeholder="New objection" className="rounded-xl border border-ink-100 px-3 py-2 text-sm outline-none" />
                <input value={newObjection.response} onChange={(event) => setNewObjection((current) => ({ ...current, response: event.target.value }))} placeholder="Response Josh should use" className="rounded-xl border border-ink-100 px-3 py-2 text-sm outline-none" />
                <button type="button" onClick={addObjection} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add</button>
              </div>
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
            <ToggleRow label="Hot lead detected" description="Alert when pricing, budget, timeline, or call intent appears." checked={escalation.alerts.hotLead} onChange={() => { const next = { ...escalation, alerts: { ...escalation.alerts, hotLead: !escalation.alerts.hotLead } }; setEscalation(next); void saveEscalation(next); }} />
            <ToggleRow label="Lead asks for human" description="Escalate when the lead asks for a person, manager, boss, or owner." checked={escalation.alerts.human} onChange={() => { const next = { ...escalation, alerts: { ...escalation.alerts, human: !escalation.alerts.human } }; setEscalation(next); void saveEscalation(next); }} />
            <ToggleRow label="Josh doesn&apos;t know answer" description="Escalate when the knowledge base cannot answer confidently." checked={escalation.alerts.unknown} onChange={() => { const next = { ...escalation, alerts: { ...escalation.alerts, unknown: !escalation.alerts.unknown } }; setEscalation(next); void saveEscalation(next); }} />
          </div>
          <div className="space-y-4 rounded-2xl border border-ink-100 bg-white p-4">
            <label className="block">
              <span className="text-sm font-semibold text-ink-900">VIP keyword detected</span>
              <input
                value={escalation.vipKeywords}
                onChange={(event) => setEscalation((current) => ({ ...current, vipKeywords: event.target.value }))}
                onBlur={() => void saveEscalation()}
                placeholder="owner, enterprise, urgent, partnership"
                className="mt-2 w-full rounded-xl border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-brand-200 focus:bg-white focus:ring-2 focus:ring-brand-500/10"
              />
            </label>
            <div>
              <span className="text-sm font-semibold text-ink-900">Notification method</span>
              <div className="mt-2 grid grid-cols-3 gap-2 rounded-2xl bg-ink-50 p-1">
                {(["In-app", "Email", "Both"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      const next = { ...escalation, notificationMethod: method };
                      setEscalation(next);
                      void saveEscalation(next);
                    }}
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                      escalation.notificationMethod === method
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
        {learningEvents.length === 0 ? (
          <EmptyPanel
            icon={Clock3}
            title={scope === "general" ? "The General Handbook hasn&apos;t learned anything yet" : "Josh hasn&apos;t learned anything yet"}
            description="Start by adding files or taking over a conversation."
          />
        ) : (
          <div className="space-y-3">
            {learningEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-ink-100 bg-white p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-600" />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{event.title}</p>
                    {event.description ? <p className="mt-1 text-xs leading-5 text-ink-500">{event.description}</p> : null}
                    {event.createdAt ? <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">{formatDate(event.createdAt)}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
          "relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
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
    </div>
  );
}

function TextAreaField({ label, value, onChange, onBlur }: { label: string; value: string; onChange: (value: string) => void; onBlur: () => void }) {
  return (
    <label className="block rounded-2xl border border-ink-100 bg-white p-4">
      <span className="text-sm font-semibold text-ink-900">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
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

function StatusBadge({ status }: { status: HandbookStatus }) {
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

function SourceItemRow({
  title,
  subtitle,
  icon: Icon,
  status,
  onDelete,
  disabled,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  status: HandbookStatus;
  onDelete: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">{title}</p>
        {subtitle ? <p className="truncate text-xs text-ink-500">{subtitle}</p> : null}
      </div>
      <StatusBadge status={status} />
      <button type="button" disabled={disabled} onClick={onDelete} className="rounded-lg p-2 text-ink-300 hover:bg-white hover:text-rose disabled:opacity-40" aria-label="Delete item">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function SaveButton({ saving, onClick, compact = false }: { saving?: boolean; onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60",
        compact ? "px-3 py-2 text-xs" : "px-4 py-2 text-sm",
      )}
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {saving ? "Saving…" : "Save"}
    </button>
  );
}

function Toast({ toast }: { toast: ToastState }) {
  return (
    <div className={cn("fixed right-6 top-6 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg", toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose text-white")}>
      {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {toast.message}
    </div>
  );
}

function InlineAlert({ tone, title, description, action }: { tone: "warning" | "error"; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3", tone === "error" ? "border-rose/20 bg-rose/10" : "border-amber/20 bg-amber/10")}>
      <AlertTriangle className={cn("mt-0.5 h-5 w-5 shrink-0", tone === "error" ? "text-rose" : "text-amber")} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-ink-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

function HandbookSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-11 w-11 animate-pulse rounded-2xl bg-ink-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded-full bg-ink-100" />
              <div className="h-5 w-56 animate-pulse rounded-full bg-ink-100" />
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-ink-300" />
          </div>
        </div>
      ))}
    </div>
  );
}

function hydrateFromPayload(
  data: Record<string, unknown>,
  setters: {
    personalityPlaceholder: string;
    setKnowledgeItems: (items: KnowledgeItem[]) => void;
    setSkills: (items: SkillItem[]) => void;
    setPersonality: React.Dispatch<React.SetStateAction<PersonalitySettings>>;
    setQualification: React.Dispatch<React.SetStateAction<QualificationSettings>>;
    setFlow: React.Dispatch<React.SetStateAction<FlowSettings>>;
    setEscalation: React.Dispatch<React.SetStateAction<EscalationSettings>>;
    setLearningEvents: (items: LearningEvent[]) => void;
  },
) {
  const root = isRecord(data.data) ? data.data : data;
  setters.setKnowledgeItems(toArray(root.knowledge ?? root.knowledgeBase ?? root.knowledgeItems).map(normalizeKnowledgeItem));
  setters.setSkills(toArray(root.skills ?? root.salesSkills).map(normalizeSkillItem).sort((a, b) => a.priority - b.priority));

  const personality = isRecord(root.personality) ? root.personality : isRecord(root.personalityTone) ? root.personalityTone : null;
  if (personality) {
    setters.setPersonality({
      instructions: toStringValue(personality.instructions ?? personality.tone ?? personality.description, setters.personalityPlaceholder),
      responseLength: normalizeResponseLength(personality.responseLength),
      emojiEnabled: Boolean(personality.emojiEnabled ?? personality.allowEmoji ?? personality.emojis),
    });
  }

  const qualification = isRecord(root.qualification) ? root.qualification : isRecord(root.qualificationCriteria) ? root.qualificationCriteria : null;
  if (qualification) {
    const criteria = toArray(qualification.criteria ?? qualification.items).map(normalizeCriterion);
    setters.setQualification({ criteria: criteria.length ? criteria : defaultCriteria });
  }

  const flow = isRecord(root.flow) ? root.flow : isRecord(root.conversationFlow) ? root.conversationFlow : null;
  if (flow) {
    setters.setFlow({
      openingMessage: toStringValue(flow.openingMessage ?? flow.opening, "Hi! Thanks for messaging us. I'm Josh — I can help you find the best option and connect you with the team if needed."),
      handoffTriggerMessage: toStringValue(flow.handoffTriggerMessage ?? flow.handoff, "This looks important, so I'm looping in the boss to help you personally."),
      bookingClosingMessage: toStringValue(flow.bookingClosingMessage ?? flow.booking ?? flow.closing, "Great. What day and time works best for a quick call or visit?"),
      qualifyingQuestions: toArray(flow.qualifyingQuestions ?? flow.questions).map(normalizeQuestion),
      objections: toArray(flow.objections ?? flow.objectionHandling).map(normalizeObjection),
    });
  }

  const escalation = isRecord(root.escalation) ? root.escalation : isRecord(root.escalationRules) ? root.escalationRules : null;
  if (escalation) {
    const alerts = isRecord(escalation.alerts) ? escalation.alerts : escalation;
    setters.setEscalation({
      alerts: {
        hotLead: Boolean(alerts.hotLead ?? alerts.hotLeadDetected ?? true),
        human: Boolean(alerts.human ?? alerts.leadAsksForHuman ?? true),
        unknown: Boolean(alerts.unknown ?? alerts.unknownAnswer ?? true),
      },
      vipKeywords: Array.isArray(escalation.vipKeywords)
        ? escalation.vipKeywords.join(", ")
        : toStringValue(escalation.vipKeywords ?? escalation.vipKeywordInput, "owner, enterprise, urgent, partnership"),
      notificationMethod: normalizeNotificationMethod(escalation.notificationMethod),
    });
  }

  setters.setLearningEvents(toArray(root.learningEvents ?? root.learningLog ?? root.events).map(normalizeLearningEvent));
}

function normalizeKnowledgeItem(value: unknown, index: number): KnowledgeItem {
  const item = isRecord(value) ? value : {};
  return {
    id: toStringValue(item.id ?? item._id, `knowledge-${index}`),
    type: toStringValue(item.type ?? item.sourceType, "file"),
    title: toStringValue(item.title ?? item.name ?? item.url ?? item.fileName, "Untitled knowledge item"),
    url: optionalString(item.url ?? item.source),
    fileName: optionalString(item.fileName ?? item.filename),
    status: normalizeStatus(item.status),
    createdAt: optionalString(item.createdAt ?? item.created_at),
  };
}

function normalizeSkillItem(value: unknown, index: number): SkillItem {
  const item = isRecord(value) ? value : {};
  return {
    id: toStringValue(item.id ?? item._id, `skill-${index}`),
    type: toStringValue(item.type ?? item.sourceType, "url"),
    title: toStringValue(item.title ?? item.name ?? item.url ?? item.fileName, "Untitled skill"),
    url: optionalString(item.url ?? item.source),
    fileName: optionalString(item.fileName ?? item.filename),
    summary: optionalString(item.summary ?? item.description),
    status: normalizeStatus(item.status ?? (item.active === false ? "Inactive" : "Active")),
    active: item.active === undefined ? true : Boolean(item.active),
    priority: Number(item.priority ?? index + 1),
    createdAt: optionalString(item.createdAt ?? item.created_at),
  };
}

function normalizeCriterion(value: unknown, index: number): Criterion {
  const item = isRecord(value) ? value : {};
  return {
    id: toStringValue(item.id ?? item.key, `criterion-${index}`),
    label: toStringValue(item.label ?? item.name ?? item.title, `Criterion ${index + 1}`),
    active: item.active === undefined ? true : Boolean(item.active),
    custom: Boolean(item.custom),
  };
}

function normalizeQuestion(value: unknown, index: number): Question {
  if (typeof value === "string") return { id: `question-${index}`, value };
  const item = isRecord(value) ? value : {};
  return {
    id: toStringValue(item.id, `question-${index}`),
    value: toStringValue(item.value ?? item.question ?? item.text, ""),
  };
}

function normalizeObjection(value: unknown, index: number): Objection {
  const item = isRecord(value) ? value : {};
  return {
    id: toStringValue(item.id, `objection-${index}`),
    objection: toStringValue(item.objection ?? item.key ?? item.title, ""),
    response: toStringValue(item.response ?? item.value ?? item.answer, ""),
  };
}

function normalizeLearningEvent(value: unknown, index: number): LearningEvent {
  const item = isRecord(value) ? value : {};
  return {
    id: toStringValue(item.id ?? item._id, `event-${index}`),
    title: toStringValue(item.title ?? item.event ?? item.type, "Handbook update"),
    description: optionalString(item.description ?? item.message ?? item.detail),
    createdAt: optionalString(item.createdAt ?? item.created_at ?? item.timestamp),
    type: optionalString(item.type),
  };
}

function normalizeStatus(status: unknown): HandbookStatus {
  const value = String(status ?? "Ready").toLowerCase();
  if (value.includes("process") || value.includes("pending")) return "Processing";
  if (value.includes("fail") || value.includes("error")) return "Failed";
  if (value.includes("inactive")) return "Inactive";
  if (value.includes("active")) return "Active";
  return "Ready";
}

function normalizeResponseLength(value: unknown): PersonalitySettings["responseLength"] {
  const normalized = String(value ?? "Balanced").toLowerCase();
  if (normalized.includes("brief") || normalized.includes("short")) return "Brief";
  if (normalized.includes("detail") || normalized.includes("long")) return "Detailed";
  return "Balanced";
}

function normalizeNotificationMethod(value: unknown): EscalationSettings["notificationMethod"] {
  const normalized = String(value ?? "In-app").toLowerCase();
  if (normalized.includes("both")) return "Both";
  if (normalized.includes("email")) return "Email";
  return "In-app";
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}

function extractErrorMessage(value: unknown) {
  if (!isRecord(value)) return null;
  return optionalString(value.error ?? value.message);
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isYoutubeUrl(url: string) {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}
