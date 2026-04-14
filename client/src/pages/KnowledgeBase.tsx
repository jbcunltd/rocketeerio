import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus, Loader2, Trash2, Edit2, Tag, Globe, FileText, Upload, Search, RefreshCw } from "lucide-react";
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
  manual: <Edit2 className="w-3 h-3" />,
};

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
    <div className="bg-white rounded-xl p-5 card-shadow border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <Globe className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Import from Website</h3>
          <p className="text-xs text-muted-foreground">Auto-crawl your website to extract business info</p>
        </div>
      </div>
      <div className="flex gap-2">
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

function PdfImportSection({ onComplete }: { onComplete: () => void }) {
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be under 20MB");
      return;
    }

    setFileName(file.name);
    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("/api/kb/import-pdf", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to process PDF");
        return;
      }

      if (data.entries?.length > 0) {
        toast.success(data.message || `Imported ${data.entries.length} entries from PDF`);
        onComplete();
      } else {
        toast.error(data.message || "No content could be extracted from the PDF");
      }
    } catch (err) {
      toast.error("Failed to import PDF");
    } finally {
      setIsImporting(false);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 card-shadow border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
          <FileText className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Upload PDF</h3>
          <p className="text-xs text-muted-foreground">Extract info from catalogs, brochures, or price lists</p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        id="pdf-upload"
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
            <span>Processing {fileName}...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>Click to upload PDF (max 20MB)</span>
          </div>
        )}
      </Button>
    </div>
  );
}

function KnowledgeBaseContent() {
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
    manual: entries.filter((e: any) => e.source === "manual").length,
  } : { total: 0, website: 0, pdf: 0, manual: 0 };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-messenger" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Manage the information your AI agent uses to answer questions.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-messenger hover:bg-messenger-dark">
              <Plus className="w-4 h-4 mr-2" /> Add Manually
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Entry" : "Add Knowledge Base Entry"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Category</Label>
                <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full mt-1.5 border rounded-lg px-3 py-2 text-sm">
                  <option value="product">Product</option>
                  <option value="pricing">Pricing</option>
                  <option value="faq">FAQ</option>
                  <option value="policy">Policy</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Product Overview" className="mt-1.5" />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Detailed information the AI will use to answer questions..." rows={5} className="mt-1.5" />
              </div>
              <Button onClick={handleSave} disabled={createEntry.isPending || updateEntry.isPending} className="w-full bg-messenger hover:bg-messenger-dark">
                {(createEntry.isPending || updateEntry.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editId ? "Update Entry" : "Add Entry"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Import Methods */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <WebsiteImportSection onComplete={handleImportComplete} />
        <PdfImportSection onComplete={handleImportComplete} />
      </div>

      {/* Stats Bar */}
      {entries && entries.length > 0 && (
        <div className="flex items-center gap-4 mb-4 text-sm">
          <span className="font-medium text-muted-foreground">{entryCounts.total} entries</span>
          <div className="flex gap-2">
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
          <p className="text-sm text-muted-foreground">Import from your website, upload a PDF, or add entries manually so the AI can answer questions accurately.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(filteredEntries || []).map((entry: any) => (
            <div key={entry.id} className="bg-white rounded-xl p-5 card-shadow border border-border/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${categoryColors[entry.category] || categoryColors.general}`}>
                    <Tag className="w-3 h-3 inline mr-1" />{entry.category}
                  </span>
                  {entry.source && entry.source !== "manual" && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {sourceIcons[entry.source]} {entry.source === "website" ? "Website" : "PDF"}
                    </span>
                  )}
                  {!entry.isActive && <span className="text-xs text-muted-foreground">(inactive)</span>}
                </div>
                <div className="flex gap-1">
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
