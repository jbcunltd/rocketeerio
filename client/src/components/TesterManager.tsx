import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, FlaskConical, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function TesterManager({ pageId }: { pageId: number }) {
  const { data: testers, isLoading } = trpc.testers.list.useQuery({ pageId });
  const addTester = trpc.testers.add.useMutation();
  const removeTester = trpc.testers.remove.useMutation();
  const utils = trpc.useUtils();

  const [psid, setPsid] = useState("");
  const [label, setLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!psid.trim()) {
      toast.error("Please enter a Facebook PSID");
      return;
    }
    try {
      await addTester.mutateAsync({
        pageId,
        psid: psid.trim(),
        label: label.trim() || undefined,
      });
      utils.testers.list.invalidate({ pageId });
      setPsid("");
      setLabel("");
      setIsAdding(false);
      toast.success("Tester account added");
    } catch {
      toast.error("Failed to add tester");
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeTester.mutateAsync({ id });
      utils.testers.list.invalidate({ pageId });
      toast.success("Tester removed");
    } catch {
      toast.error("Failed to remove tester");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-messenger" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="font-bold text-sm">Tester Accounts</p>
            <p className="text-xs text-muted-foreground">
              In Testing mode, only these accounts receive AI responses
            </p>
          </div>
        </div>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Tester
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-orange-50/50 border border-orange-200 rounded-lg p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold">Facebook PSID <span className="text-destructive">*</span></Label>
              <Input
                value={psid}
                onChange={e => setPsid(e.target.value)}
                placeholder="e.g. 6145328790123456"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Label (optional)</Label>
              <Input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. John (Owner)"
                className="mt-1 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            To find a PSID: Send a message to your page from the test account, then check the Leads section for the PSID value.
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={addTester.isPending || !psid.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {addTester.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
              Add Tester
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setIsAdding(false); setPsid(""); setLabel(""); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {testers && testers.length > 0 ? (
        <div className="space-y-2">
          {testers.map(tester => (
            <div
              key={tester.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-orange-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {tester.label || "Tester Account"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    PSID: {tester.psid}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(tester.id)}
                disabled={removeTester.isPending}
                className="text-destructive hover:text-destructive hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed">
            <UserCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No tester accounts added yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add tester PSIDs to test your AI in Testing mode.</p>
          </div>
        )
      )}
    </div>
  );
}
