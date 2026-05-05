import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Rocketeerio collects, uses, and protects your personal data. GDPR and Philippine Data Privacy Act compliant.",
  alternates: { canonical: "https://rocketeerio.com/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" effective="May 1, 2026" lastUpdated="May 2026">
      <p>
        Rocketeerio (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
        respects your privacy and is committed to protecting your personal
        data. This Privacy Policy explains how we collect, use, and safeguard
        your information when you use our website (rocketeerio.com) and our
        Facebook lead conversion services (the &quot;Service&quot;). It applies
        to all users worldwide and is designed to comply with the European
        Union&apos;s General Data Protection Regulation (GDPR) and the
        Philippine Data Privacy Act of 2012 (RA 10173).
      </p>

      <h2>1. Information we collect</h2>
      <p>
        We collect personal data in three ways: information you provide
        directly, information collected automatically when you use our
        Service, and information received from connected third-party
        platforms such as Meta (Facebook and Instagram).
      </p>
      <h3>a. Information you provide</h3>
      <ul>
        <li>
          Account information: name, email address, password, business name,
          time zone.
        </li>
        <li>
          Billing information: payment method, billing address, transaction
          history (processed by our payment processor).
        </li>
        <li>
          Configuration data: qualification flows, brand voice settings,
          notification preferences.
        </li>
        <li>
          Support communications you send to us.
        </li>
      </ul>
      <h3>b. Information collected automatically</h3>
      <ul>
        <li>
          Device and usage data: IP address, browser type, operating system,
          referring URL, pages viewed, timestamps.
        </li>
        <li>
          Cookies and similar tracking technologies (see our{" "}
          <a href="/cookies">Cookie Policy</a>).
        </li>
      </ul>
      <h3>c. Information from third parties</h3>
      <ul>
        <li>
          Meta integration data: Facebook Page name, message content from
          users who message your Page, Lead Ad form responses, Instagram DM
          content. We only access data you have authorized via Meta&apos;s
          OAuth flow.
        </li>
        <li>
          CRM integration data, if you choose to connect HubSpot,
          GoHighLevel, Pipedrive, or similar.
        </li>
      </ul>

      <h2>2. How we use your information</h2>
      <p>
        We use the information we collect to: (a) provide, operate, and
        maintain the Service; (b) reply to and qualify leads on your behalf
        as configured by you; (c) send hot-lead notifications to you; (d)
        improve, personalize, and develop the Service; (e) communicate with
        you about your account, support requests, and product updates;
        (f) process payments; and (g) comply with legal obligations.
      </p>

      <h2>3. Legal bases for processing (GDPR)</h2>
      <p>
        For users in the European Economic Area, we rely on the following
        legal bases: contractual necessity (to deliver the Service you
        signed up for), legitimate interest (to operate, secure, and
        improve our Service), consent (for optional cookies and marketing
        communications), and legal obligation.
      </p>

      <h2>4. Sharing of information</h2>
      <p>
        We do not sell your personal data. We share data only with: (a)
        service providers who help us run the Service, including hosting
        (Vercel), analytics, and payment processing (Stripe), each bound
        by data processing agreements; (b) Meta, in order to send and
        receive messages on your behalf; (c) authorities, when legally
        required; and (d) acquirers in the event of a merger or
        acquisition, with notice to you.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We retain personal data only as long as necessary for the purposes
        described above and to comply with our legal obligations. Lead
        conversation data is retained for 24 months by default; you may
        request earlier deletion at any time. Account data is deleted within
        30 days of account closure, except where retention is legally
        required.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Subject to applicable law, you have the right to access, correct,
        update, port, or delete your personal data, to object to or restrict
        certain processing, and to withdraw consent at any time. EU
        residents may lodge a complaint with their local data protection
        authority. Philippine residents may contact the National Privacy
        Commission. To exercise any of these rights, email{" "}
        <a href="mailto:privacy@rocketeerio.com">privacy@rocketeerio.com</a>{" "}
        and we will respond within 30 days.
      </p>

      <h2>7. International data transfers</h2>
      <p>
        Rocketeerio operates globally. Your data may be transferred to and
        processed in countries outside your country of residence, including
        the United States and the Philippines. Where required, we use
        Standard Contractual Clauses or other lawful transfer mechanisms.
      </p>

      <h2>8. Security</h2>
      <p>
        We use industry-standard technical and organizational safeguards to
        protect your data, including TLS encryption in transit, encryption
        at rest, regular access reviews, and strict role-based access
        controls. No system can be guaranteed 100% secure; if a breach
        occurs that affects your personal data, we will notify you and the
        relevant authorities without undue delay.
      </p>

      <h2>9. Children&apos;s privacy</h2>
      <p>
        The Service is not intended for individuals under 16. We do not
        knowingly collect personal data from children. If we become aware
        that we have, we will delete it promptly.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post
        the updated version here and, where required, notify you by email.
        The &quot;Effective&quot; date at the top reflects the latest
        revision.
      </p>

      <h2>11. Contact us</h2>
      <p>
        For any questions about this Privacy Policy or your personal data,
        contact our Data Protection team at{" "}
        <a href="mailto:privacy@rocketeerio.com">privacy@rocketeerio.com</a>.
      </p>
    </LegalLayout>
  );
}
