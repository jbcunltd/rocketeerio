import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How Rocketeerio uses cookies and similar tracking technologies on our website.",
  alternates: { canonical: "https://rocketeerio.com/cookies" },
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" effective="May 1, 2026" lastUpdated="May 2026">
      <p>
        This Cookie Policy explains how Rocketeerio uses cookies and
        similar tracking technologies on rocketeerio.com (the
        &quot;Site&quot;). It should be read together with our{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files placed on your device by websites you
        visit. They are widely used to make websites work, to make them
        work more efficiently, and to provide information to the site
        owners.
      </p>

      <h2>2. Types of cookies we use</h2>

      <h3>Strictly necessary</h3>
      <p>
        Required for the Site to function — for example, to remember your
        session, keep you logged into your account, and protect against
        fraud. You cannot opt out of these.
      </p>

      <h3>Performance and analytics</h3>
      <p>
        Help us understand how visitors interact with the Site (which
        pages are most viewed, which content is most useful) so we can
        improve it. We use a privacy-respecting analytics provider that
        does not share data with advertisers.
      </p>

      <h3>Functional</h3>
      <p>
        Remember preferences such as your selected language or chosen
        billing currency.
      </p>

      <h3>Marketing</h3>
      <p>
        Set by Rocketeerio or by third parties (such as Meta and Google)
        to measure ad performance and to show you relevant ads on other
        websites. We only set these with your consent.
      </p>

      <h2>3. How to control cookies</h2>
      <p>
        You can control cookies through our cookie banner (where shown),
        your browser settings, and the opt-out pages provided by major
        advertising networks. Note that disabling certain cookies may
        affect the functionality of the Site.
      </p>

      <h2>4. Do Not Track</h2>
      <p>
        Some browsers offer a &quot;Do Not Track&quot; (DNT) signal. There
        is currently no industry-standard interpretation of DNT signals,
        and we do not currently respond to them. We will update this
        section if a standard emerges.
      </p>

      <h2>5. Changes to this policy</h2>
      <p>
        We may update this Cookie Policy from time to time. The
        &quot;Effective&quot; date at the top reflects the latest
        revision.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about cookies? Email us at{" "}
        <a href="mailto:privacy@rocketeerio.com">privacy@rocketeerio.com</a>.
      </p>
    </LegalLayout>
  );
}
