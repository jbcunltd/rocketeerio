import Link from "next/link";
import { Logo } from "./logo";
import { Mail, MessageCircle, Shield } from "lucide-react";

const COL_PRODUCT = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Testimonials", href: "/testimonials" },
];

const COL_RESOURCES = [
  { label: "Blog", href: "/blog" },
  { label: "Why leads aren't converting", href: "/blog/why-facebook-leads-arent-converting" },
  { label: "60-second response", href: "/blog/responding-to-leads-under-60-seconds" },
  { label: "Lead automation guide", href: "/blog/ultimate-guide-facebook-lead-automation-2025" },
];

const COL_COMPANY = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "mailto:hello@rocketeerio.com" },
];

const COL_LEGAL = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-100 bg-ink-50/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-600">
              The AI-powered Facebook lead conversion system. Reply instantly,
              qualify automatically, close more deals — even while you sleep.
            </p>

            <form
              className="mt-6 flex w-full max-w-sm rounded-xl border border-ink-200 bg-white p-1 shadow-sm"
              action="#"
              method="post"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="you@business.com"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400 outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Get the guide
              </button>
            </form>
            <p className="mt-2 text-xs text-ink-400">
              Free PDF: 7 reasons your Facebook leads aren&apos;t converting.
            </p>

            <div className="mt-6 flex items-center gap-4 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-mint" /> SSL secured
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-brand-500" /> Meta-compliant
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            <FooterCol title="Product" links={COL_PRODUCT} />
            <FooterCol title="Resources" links={COL_RESOURCES} />
            <FooterCol title="Company" links={COL_COMPANY} />
            <FooterCol title="Legal" links={COL_LEGAL} />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-ink-100 pt-6 text-xs text-ink-500 sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} Rocketeerio. All rights reserved.
            Built for businesses that live and die by Facebook leads.
          </p>
          <a
            href="mailto:hello@rocketeerio.com"
            className="inline-flex items-center gap-1.5 hover:text-ink-800"
          >
            <Mail className="h-3.5 w-3.5" /> hello@rocketeerio.com
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-900">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-ink-600 hover:text-brand-600"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
