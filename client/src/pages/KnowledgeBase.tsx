import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useActivePage } from "@/contexts/ActivePageContext";
import { BookOpen, Plus, Loader2, Trash2, Edit2, Tag, Globe, FileText, Upload, Search, RefreshCw, X, File, Image, Facebook } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

const categoryColors: Record<string, string> = {
  product: "bg-blue-50 text-blue-600",
  pricing: "bg-green-50 text-green-600",
  faq: "bg-purple-50 text-purple-600",
  policy: "bg-amber-50 text-amber-600",
  general: "bg-slate-100 text-slate-600",
};

const sourceIcons: Record<string, React.ReactNode> = {
  website: <Globe className="w-3 h-3" />,
  pdf: <FileText className="w-3 h-3" />,
  file: <File className="w-3 h-3" />,
  manual: <Edit2 className="w-3 h-3" />,
};

const ACCEPTED_FILE_TYPES = ".pdf,.docx,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp";
const ACCEPTED_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function getFileTypeLabel(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("wordprocessingml")) return "Word Document";
  if (mimeType.includes("spreadsheetml")) return "Excel Spreadsheet";
  if (mimeType === "text/csv") return "CSV";
  if (mimeType === "text/plain") return "Text File";
  if (mimeType.startsWith("image/")) return "Image";
  return "File";
}

function WebsiteImportSection({ onComplete }: { onComplete: () => void }) {
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState("");

  const handleImport = async () => {
    if (!url.trim()) { toast.error("Please enter a website URL"); return; }
    setIsImporting(true);
    setProgress("Crawling website pages...");

    try {
      const res = await fetch("/api/kb/import-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to crawl website");
        return;
      }

      if (data.entries?.length > 0) {
        toast.success(data.message || `Imported ${data.entries.length} entries`);
        setUrl("");
        onComplete();
      } else {
        toast.error(data.message || "No content could be extracted");
      }
    } catch (err) {
      toast.error("Failed to import from website");
    } finally {
      setIsImporting(false);
      setProgress("");
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 card-shadow border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
          <Globe className="w-4 h-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm">Import from Website</h3>
          <p className="text-xs text-muted-foreground">Auto-crawl your website to extract business info</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://yourbusiness.com"
          className="flex-1"
          disabled={isImporting}
          onKeyDown={e => e.key === "Enter" && handleImport()}
        />
        <Button onClick={handleImport} disabled={isImporting} className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
          {isImporting ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Crawling...</>
          ) : (
            <><Search className="w-4 h-4 mr-2" /> Import</>
          )}
        </Button>
      </div>
      {isImporting && progress && (
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{progress}</span>
        </div>
      )}
    </div>
  );
}

function FileImportSection({ onComplete }: { onComplete: () => void }) {
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_MIMES.includes(file.type)) {
      toast.error("Unsupported file type. Accepted: PDF, DOCX, XLSX, CSV, TXT, JPG, PNG.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be under 20MB");
      return;
    }

    setFileName(file.name);
    setFileType(getFileTypeLabel(file.type));
    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/kb/import-file", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to process file");
        return;
      }

      if (data.entries?.length > 0) {
        toast.success(data.message || `Imported ${data.entries.length} entries from file`);
        onComplete();
      } else {
        toast.error(data.message || "No content could be extracted from the file");
      }
    } catch (err) {
      toast.error("Failed to import file");
    } finally {
      setIsImporting(false);
      setFileName("");
      setFileType("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 card-shadow border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
          <Upload className="w-4 h-4 text-green-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm">Upload File</h3>
          <p className="text-xs text-muted-foreground">PDF, Word, Excel, CSV, images, or text files</p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        variant="outline"
        className="w-full border-dashed border-2 h-16 hover:bg-green-50"
      >
        {isImporting ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing {fileType}: {fileName}...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Click to upload a file (max 20MB)</span>
            </div>
            <span className="text-xs text-muted-foreground">PDF, DOCX, XLSX, CSV, TXT, JPG, PNG</span>
          </div>
        )}
      </Button>
    </div>
  );
}

function KnowledgeBaseContent() {
  const { activePage } = useActivePage();
  const { data: entries, isLoading } = trpc.knowledgeBase.list.useQuery();
  const createEntry = trpc.knowledgeBase.create.useMutation();
  const updateEntry = trpc.knowledgeBase.update.useMutation();
  const deleteEntry = trpc.knowledgeBase.delete.useMutation();
  const utils = trpc.useUtils();

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"product" | "pricing" | "faq" | "policy" | "general">("general");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const resetForm = () => { setTitle(""); setContent(""); setCategory("general"); setEditId(null); };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Title and content are required"); return; }
    try {
      if (editId) {
        await updateEntry.mutateAsync({ id: editId, title: title.trim(), content: content.trim(), category });
        toast.success("Entry updated");
      } else {
        await createEntry.mutateAsync({ title: title.trim(), content: content.trim(), category });
        toast.success("Entry added");
      }
      utils.knowledgeBase.list.invalidate();
      resetForm();
      setIsOpen(false);
    } catch { toast.error("Failed to save entry"); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEntry.mutateAsync({ id });
      utils.knowledgeBase.list.invalidate();
      toast.success("Entry deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleEdit = (entry: any) => {
    setEditId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setCategory(entry.category);
    setIsOpen(true);
  };

  const handleImportComplete = () => {
    utils.knowledgeBase.list.invalidate();
  };

  const filteredEntries = entries?.filter((entry: any) => {
    if (filterCategory !== "all" && entry.category !== filterCategory) return false;
    if (filterSource !== "all" && entry.source !== filterSource) return false;
    return true;
  });

  const entryCounts = entries ? {
    total: entries.length,
    website: entries.filter((e: any) => e.source === "website").length,
    pdf: entries.filter((e: any) => e.source === "pdf").length,
    file: entries.filter((e: any) => e.source === "file").length,
    manual: entries.filter((e: any) => e.source === "manual").length,
  } : { total: 0, website: 0, pdf: 0, file: 0, manual: 0 };

  const expandedEntry = entries?.find((e: any) => e.id === expandedId);

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-messenger" /></div>;

  return (
    <div>
      {/* Page context banner */}
      {activePage && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
          {activePage.avatarUrl ? (
            <img src={activePage.avatarUrl} alt={activePage.pageName} className="w-5 h-5 rounded" />
          ) : (
            <Facebook className="w-4 h-4 text-[#1877F2]" />
          )}
          <p className="text-sm text-blue-800">Knowledge base for <strong>{activePage.pageName}</strong></p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">Manage the information your AI agent uses to answer questions.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-messenger hover:bg-messenger-dark w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Add Manually
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Entry" : "Add Knowledge Base Entry"}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 mt-2 pr-1">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Category</Label>
                  <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full mt-1.5 border rounded-lg px-3 py-2 text-sm">
                    <option value="product">Product</option>
                    <option value="pricing">Pricing</option>
                    <option value="faq">FAQ</option>
                    <option value="policy">Policy</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Label>Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Product Overview" className="mt-1.5" />
                </div>
              </div>
              <div className="flex-1">
                <Label>Content</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">Paste your full script here. The AI will use this to answer customer questions.</p>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste your full sales script, objection handling, pricing info, or any content the AI should know..."
                  className="w-full min-h-[300px] max-h-[50vh] border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-messenger/50 focus:border-messenger"
                />
              </div>
            </div>
            <div className="pt-4 border-t mt-2">
              <Button onClick={handleSave} disabled={createEntry.isPending || updateEntry.isPending} className="w-full bg-messenger hover:bg-messenger-dark">
                {(createEntry.isPending || updateEntry.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editId ? "Update Entry" : "Add Entry"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Import Methods */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 mb-6">
        <WebsiteImportSection onComplete={handleImportComplete} />
        <FileImportSection onComplete={handleImportComplete} />
      </div>

      {/* Stats Bar */}
      {entries && entries.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 text-sm">
          <span className="font-medium text-muted-foreground">{entryCounts.total} entries</span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterSource("all")}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filterSource === "all" ? "bg-messenger text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              All
            </button>
            {entryCounts.website > 0 && (
              <button
                onClick={() => setFilterSource("website")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filterSource === "website" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
              >
                <Globe className="w-3 h-3" /> Website ({entryCounts.website})
              </button>
            )}
            {entryCounts.pdf > 0 && (
              <button
                onClick={() => setFilterSource("pdf")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filterSource === "pdf" ? "bg-green-600 text-white" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
              >
                <FileText className="w-3 h-3" /> PDF ({entryCounts.pdf})
              </button>
            )}
            {entryCounts.file > 0 && (
              <button
                onClick={() => setFilterSource("file")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filterSource === "file" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600 hover:bg-purple-100"}`}
              >
                <File className="w-3 h-3" /> File ({entryCounts.file})
              </button>
            )}
            {entryCounts.manual > 0 && (
              <button
                onClick={() => setFilterSource("manual")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filterSource === "manual" ? "bg-gray-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <Edit2 className="w-3 h-3" /> Manual ({entryCounts.manual})
              </button>
            )}
          </div>
        </div>
      )}

      {!entries?.length ? (
        <div className="bg-white rounded-xl p-12 card-shadow border border-border/50 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No knowledge base entries yet.</p>
          <p className="text-sm text-muted-foreground">Import from your website, upload a file (PDF, Word, Excel, CSV, images, or text), or add entries manually so the AI can answer questions accurately.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {(filteredEntries || []).map((entry: any) => (
            <div
              key={entry.id}
              className="bg-white rounded-xl p-4 sm:p-5 card-shadow border border-border/50 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${categoryColors[entry.category] || categoryColors.general}`}>
                    <Tag className="w-3 h-3 inline mr-1" />{entry.category}
                  </span>
                  {entry.source && entry.source !== "manual" && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {sourceIcons[entry.source] || <File className="w-3 h-3" />} {entry.source === "website" ? "Website" : entry.source === "pdf" ? "PDF" : entry.source === "file" ? "File" : entry.source}
                    </span>
                  )}
                  {!entry.isActive && <span className="text-xs text-muted-foreground">(inactive)</span>}
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(entry.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <h3 className="font-bold text-foreground mb-1">{entry.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>
              {entry.sourceUrl && (
                <p className="text-xs text-muted-foreground mt-2 truncate" title={entry.sourceUrl}>
                  Source: {entry.sourceUrl}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expanded Entry Modal */}
      {expandedId !== null && expandedEntry && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          onClick={() => setExpandedId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b">
              <div className="flex-1 pr-4">
                <h2 className="text-2xl font-bold text-foreground">
                  {expandedEntry.title}
                </h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${categoryColors[expandedEntry.category] || categoryColors.general}`}>
                    <Tag className="w-3 h-3 inline mr-1" />{expandedEntry.category}
                  </span>
                  {expandedEntry.source && expandedEntry.source !== "manual" && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {sourceIcons[expandedEntry.source] || <File className="w-3 h-3" />} {expandedEntry.source === "website" ? "Website" : expandedEntry.source === "pdf" ? "PDF" : expandedEntry.source === "file" ? "File" : expandedEntry.source}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setExpandedId(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap text-base leading-relaxed">
                  {expandedEntry.content}
                </p>
              </div>
              {expandedEntry.sourceUrl && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Source:</p>
                  <a
                    href={expandedEntry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-messenger hover:text-messenger-dark break-all text-sm"
                  >
                    {expandedEntry.sourceUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleEdit(expandedEntry);
                    setExpandedId(null);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    handleDelete(expandedId);
                    setExpandedId(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setExpandedId(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KnowledgeBase() {
  return (
    <DashboardLayout>
      <KnowledgeBaseContent />
    </DashboardLayout>
  );
}
