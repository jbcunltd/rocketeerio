import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus, Loader2, Trash2, Edit2, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const categoryColors: Record<string, string> = {
  product: "bg-blue-50 text-blue-600",
  pricing: "bg-green-50 text-green-600",
  faq: "bg-purple-50 text-purple-600",
  policy: "bg-amber-50 text-amber-600",
  general: "bg-slate-100 text-slate-600",
};

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
              <Plus className="w-4 h-4 mr-2" /> Add Entry
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

      {!entries?.length ? (
        <div className="bg-white rounded-xl p-12 card-shadow border border-border/50 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No knowledge base entries yet.</p>
          <p className="text-sm text-muted-foreground">Add your products, pricing, FAQs, and policies so the AI can answer questions accurately.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {entries.map((entry: any) => (
            <div key={entry.id} className="bg-white rounded-xl p-5 card-shadow border border-border/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${categoryColors[entry.category] || categoryColors.general}`}>
                    <Tag className="w-3 h-3 inline mr-1" />{entry.category}
                  </span>
                  {!entry.isActive && <span className="text-xs text-muted-foreground">(inactive)</span>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(entry.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <h3 className="font-bold text-foreground mb-1">{entry.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>
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
