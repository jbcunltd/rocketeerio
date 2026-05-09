import Link from "next/link";

export function Logo({ className = "", href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
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
          {/* Rocketeer helmet - tilted slightly */}
          <g transform="rotate(-8 12 12)">
            {/* Helmet dome */}
            <path
              d="M6 12C6 8.5 8.5 6 12 6C15.5 6 18 8.5 18 12L18 15C18 16.1 17.1 17 16 17H8C6.9 17 6 16.1 6 15V12Z"
              fill="white"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Left ear piece */}
            <rect x="4.5" y="11" width="1.5" height="3" rx="0.7" fill="white" />
            {/* Right ear piece */}
            <rect x="18" y="11" width="1.5" height="3" rx="0.7" fill="white" />
            {/* Visor opening (negative space - shows background) */}
            <ellipse cx="12" cy="10.5" rx="4.5" ry="3.5" fill="#0084FF" />
            {/* Reflection arc inside visor */}
            <path
              d="M9.5 8.5Q12 7.5 14.5 8.5"
              stroke="white"
              strokeWidth="0.6"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
            {/* Chin guard */}
            <path
              d="M8 15C8 15.5 9 16 12 16C15 16 16 15.5 16 15"
              stroke="white"
              strokeWidth="0.4"
              fill="none"
              opacity="0.7"
            />
          </g>
        </svg>
      </span>
      <span className="text-[1.05rem] font-bold tracking-tight text-ink-900">
        Rocketeerio
      </span>
    </Link>
  );
}
