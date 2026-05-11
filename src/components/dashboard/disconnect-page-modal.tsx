"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface DisconnectPageModalProps {
  pageName: string;
  pageId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pageId: string) => Promise<void>;
}

export function DisconnectPageModal({
  pageName,
  pageId,
  isOpen,
  onClose,
  onConfirm,
}: DisconnectPageModalProps) {
  const [checkbox1, setCheckbox1] = useState(false);
  const [checkbox2, setCheckbox2] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmDisabled =
    !checkbox1 || !checkbox2 || confirmText !== "disconnect" || isLoading;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(pageId);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect page"
      );
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose/10">
              <AlertTriangle className="h-5 w-5 text-rose" />
            </div>
            <h2 className="text-lg font-semibold text-ink-900">
              Disconnect Page?
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-ink-400 hover:text-ink-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-4">
          <div className="rounded-lg bg-rose/5 p-3">
            <p className="text-sm text-ink-700">
              <strong>Disconnecting &quot;{pageName}&quot;</strong> will:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-ink-600">
              <li>• Josh will stop responding to messages on this page</li>
              <li>• Conversation history will be preserved</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>

          {error && (
            <div className="rounded-lg border border-rose/40 bg-rose/5 p-3 text-sm text-rose">
              {error}
            </div>
          )}

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={checkbox1}
                onChange={(e) => setCheckbox1(e.target.checked)}
                disabled={isLoading}
                className="mt-1 h-4 w-4 rounded border-ink-300 text-rose focus:ring-rose disabled:opacity-50"
              />
              <span className="text-sm text-ink-700">
                I understand Josh will stop responding to messages on this page
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={checkbox2}
                onChange={(e) => setCheckbox2(e.target.checked)}
                disabled={isLoading}
                className="mt-1 h-4 w-4 rounded border-ink-300 text-rose focus:ring-rose disabled:opacity-50"
              />
              <span className="text-sm text-ink-700">
                I understand this action cannot be undone
              </span>
            </label>
          </div>

          {/* Confirmation text input */}
          <div>
            <label className="block text-sm font-medium text-ink-700">
              Type <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs text-ink-900">&quot;disconnect&quot;</code> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toLowerCase())}
              disabled={isLoading}
              placeholder="disconnect"
              className="mt-2 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-ink-50 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-ink-100 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-rose px-4 py-2 text-sm font-medium text-white hover:bg-rose/90 focus:outline-none focus:ring-2 focus:ring-rose/40 disabled:pointer-events-none disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              "Disconnect"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
