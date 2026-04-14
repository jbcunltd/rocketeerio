import { trpc } from "@/lib/trpc";
import { Pause, FlaskConical, Rocket, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

type AiMode = "paused" | "testing" | "live";

const MODE_CONFIG: Record<AiMode, {
  label: string;
  description: string;
  icon: typeof Pause;
  dotColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  hoverBg: string;
}> = {
  paused: {
    label: "Paused",
    description: "AI is off — not responding to anyone",
    icon: Pause,
    dotColor: "bg-gray-400",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-600",
    hoverBg: "hover:bg-gray-100",
  },
  testing: {
    label: "Testing",
    description: "AI only responds to tester accounts",
    icon: FlaskConical,
    dotColor: "bg-orange-400",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    hoverBg: "hover:bg-orange-100",
  },
  live: {
    label: "Live",
    description: "AI responds to everyone",
    icon: Rocket,
    dotColor: "bg-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    hoverBg: "hover:bg-green-100",
  },
};

const MODES: AiMode[] = ["paused", "testing", "live"];

export function AiModeToggle({ pageId, currentMode, compact = false }: {
  pageId: number;
  currentMode: AiMode;
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const updateMode = trpc.pageMode.update.useMutation();
  const utils = trpc.useUtils();

  const config = MODE_CONFIG[currentMode];
  const Icon = config.icon;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleModeChange = async (mode: AiMode) => {
    if (mode === currentMode) {
      setIsOpen(false);
      return;
    }
    try {
      await updateMode.mutateAsync({ pageId, mode });
      utils.pages.list.invalidate();
      utils.pageMode.get.invalidate({ pageId });
      setIsOpen(false);
      const modeConfig = MODE_CONFIG[mode];
      toast.success(`AI mode switched to ${modeConfig.label}`, {
        description: modeConfig.description,
      });
    } catch {
      toast.error("Failed to update AI mode");
    }
  };

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold transition-all ${config.bgColor} ${config.textColor} ${config.borderColor} border ${config.hoverBg}`}
        >
          <span className={`w-2 h-2 rounded-full ${config.dotColor} ${currentMode === "live" ? "animate-pulse" : ""}`} />
          {config.label}
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg border shadow-lg z-50 py-1">
            {MODES.map(mode => {
              const mc = MODE_CONFIG[mode];
              const ModeIcon = mc.icon;
              return (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    mode === currentMode ? `${mc.bgColor} ${mc.textColor} font-semibold` : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${mc.dotColor}`} />
                  <ModeIcon className="w-3.5 h-3.5" />
                  <span>{mc.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={updateMode.isPending}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all ${config.bgColor} ${config.borderColor} ${config.hoverBg} ${
          updateMode.isPending ? "opacity-60 cursor-wait" : "cursor-pointer"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor} ${currentMode === "live" ? "animate-pulse" : ""}`} />
          <Icon className={`w-4 h-4 ${config.textColor}`} />
          <div className="text-left">
            <div className={`text-sm font-bold ${config.textColor}`}>
              AI Agent: {config.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {config.description}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 ${config.textColor} transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
          {MODES.map(mode => {
            const mc = MODE_CONFIG[mode];
            const ModeIcon = mc.icon;
            const isActive = mode === currentMode;
            return (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive ? `${mc.bgColor} ${mc.textColor}` : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${mc.dotColor} shrink-0`} />
                <ModeIcon className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <div className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>{mc.label}</div>
                  <div className="text-xs text-muted-foreground">{mc.description}</div>
                </div>
                {isActive && (
                  <div className={`ml-auto text-xs font-bold ${mc.textColor}`}>Active</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AiModeBadge({ mode }: { mode: AiMode }) {
  const config = MODE_CONFIG[mode];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} ${config.borderColor} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${mode === "live" ? "animate-pulse" : ""}`} />
      {config.label}
    </span>
  );
}

export { MODE_CONFIG };
export type { AiMode };
