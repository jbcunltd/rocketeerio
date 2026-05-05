import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions that govern your use of the Rocketeerio service.",
  alternates: { canonical: "https://rocketeerio.com/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" effective="May 1, 2026" lastUpdated="May 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and
        use of the Rocketeerio website and services (the &quot;Service&quot;).
        By creating an account or using the Service, you agree to these
        Terms. If you do not agree, do not use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old and have the legal capacity to
        enter into a binding contract to use the Service. By using the
        Service, you represent that you meet these requirements and that
        the information you provide is accurate.
      </p>

      <h2>2. The Service</h2>
      <p>
        Rocketeerio provides AI-powered tools that auto-reply to leads on
        Meta platforms (Facebook Messenger, Instagram DMs, and Lead Ads),
        qualify those leads using rules you configure, and notify you of
        leads ready for sales follow-up. The Service is provided
        &quot;as is&quot; and &quot;as available.&quot;
      </p>

      <h2>3. Your account</h2>
      <p>
        You are responsible for maintaining the confidentiality of your
        account credentials and for all activity under your account. Notify
        us immediately at{" "}
        <a href="mailto:security@rocketeerio.com">security@rocketeerio.com</a>{" "}
        if you suspect unauthorized access.
      </p>

      <h2>4. Acceptable use</h2>
      <p>
        You agree not to use the Service to: (a) violate any applicable
        law or regulation; (b) infringe the rights of any third party,
        including intellectual property and privacy rights; (c) send spam,
        unsolicited messages, or content that violates Meta&apos;s
        Platform Policies; (d) attempt to interfere with or disrupt the
        Service; (e) reverse engineer or copy the Service; or (f) use the
        Service in a way that could harm Rocketeerio or other users.
      </p>

      <h2>5. Subscription, billing & free trial</h2>
      <p>
        The Service is offered on subscription plans described on our{" "}
        <a href="/pricing">pricing page</a>. Fees are billed in advance on
        a monthly or annual basis, automatically renewed unless cancelled
        before the renewal date, and non-refundable except as expressly
        provided herein or under the money-back guarantee. New users may
        be eligible for a free trial; trial terms are described at signup.
      </p>

      <h2>6. Money-back guarantee</h2>
      <p>
        We offer a 14-day money-back guarantee on first-time paid
        subscriptions. To request a refund, email{" "}
        <a href="mailto:billing@rocketeerio.com">billing@rocketeerio.com</a>{" "}
        within 14 days of your first paid charge.
      </p>

      <h2>7. Cancellation</h2>
      <p>
        You may cancel your subscription at any time from your dashboard.
        Cancellation takes effect at the end of the current billing
        period. You retain access to the Service until that date.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        Rocketeerio retains all rights, title, and interest in and to the
        Service, including all software, content, and trademarks. You
        retain ownership of content you upload, including your brand
        voice settings, qualification flows, and conversation data. You
        grant us a limited license to use that content solely to operate
        the Service for you.
      </p>

      <h2>9. Third-party platforms</h2>
      <p>
        The Service depends on Meta&apos;s APIs and other third-party
        services. We are not responsible for downtime, policy changes, or
        actions taken by those third parties that affect your use of the
        Service.
      </p>

      <h2>10. Disclaimers</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED
        &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
        OF ANY KIND, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, ROCKETEERIO&apos;S TOTAL
        LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE
        SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID
        US IN THE TWELVE MONTHS PRECEDING THE CLAIM OR (B) USD $100. WE
        WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL,
        CONSEQUENTIAL, OR PUNITIVE DAMAGES.
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You agree to indemnify and hold Rocketeerio harmless from any
        claim, loss, or liability arising out of (a) your use of the
        Service in breach of these Terms, (b) content you upload, or (c)
        your violation of any law or third-party right.
      </p>

      <h2>13. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time
        if you violate these Terms or use the Service in a way that could
        harm us, other users, or Meta&apos;s platforms. We will give you
        notice where reasonably possible.
      </p>

      <h2>14. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of the Republic of the
        Philippines, without regard to conflict-of-laws principles. Any
        dispute arising out of or relating to these Terms or the Service
        will be resolved in the courts of Cebu City, Philippines, except
        where you have a non-waivable right to bring proceedings in your
        country of residence.
      </p>

      <h2>15. Changes to these terms</h2>
      <p>
        We may update these Terms from time to time. We will post the
        updated version here and, where the changes are material, notify
        you by email at least 14 days before they take effect. Continued
        use of the Service after the effective date constitutes
        acceptance.
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions about these Terms? Contact us at{" "}
        <a href="mailto:hello@rocketeerio.com">hello@rocketeerio.com</a>.
      </p>
    </LegalLayout>
  );
}
