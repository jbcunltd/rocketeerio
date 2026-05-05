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
          {/* Chat bubble background */}
          <path
            d="M3 8C3 5.239 5.239 3 8 3H16C18.761 3 21 5.239 21 8V14C21 16.761 18.761 19 16 19H8.5L4.5 22V19H8C5.239 19 3 16.761 3 14V8Z"
            fill="white"
          />
          {/* Brain/AI icon - left hemisphere */}
          <circle cx="8.5" cy="9" r="1.2" fill="#0084FF" />
          {/* Brain/AI icon - right hemisphere */}
          <circle cx="15.5" cy="9" r="1.2" fill="#0084FF" />
          {/* Neural connection lines */}
          <path
            d="M8.5 10.2C9.5 11 11 11.5 12 11.5C13 11.5 14.5 11 15.5 10.2"
            stroke="#0084FF"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />
          {/* Synapse dots */}
          <circle cx="10" cy="10.8" r="0.6" fill="#0084FF" />
          <circle cx="14" cy="10.8" r="0.6" fill="#0084FF" />
        </svg>
      </span>
      <span className="text-[1.05rem] font-bold tracking-tight text-ink-900">
        Rocketeerio
      </span>
    </Link>
  );
}
