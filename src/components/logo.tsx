import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 group ${className}`}
      aria-label="Rocketeerio home"
    >
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm shadow-brand-500/30 transition-transform group-hover:rotate-[-6deg]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-4.5 w-4.5"
          width="18"
          height="18"
          aria-hidden="true"
        >
          <path
            d="M12 2 L18 9 L15 12 L19 18 L13 16 L12 22 L11 16 L5 18 L9 12 L6 9 Z"
            fill="white"
          />
        </svg>
      </span>
      <span className="text-[1.05rem] font-bold tracking-tight text-ink-900">
        Rocketeerio
      </span>
    </Link>
  );
}
