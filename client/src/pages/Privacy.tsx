import { useEffect } from "react";

export function Privacy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
            <p>
              Rocketeerio ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Information We Collect</h2>
            <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Data:</strong> Email address, name, and other information you provide when creating an account</li>
              <li><strong>Facebook/Instagram Data:</strong> When you connect your Facebook or Instagram account, we collect page information, messages, and user data as necessary to provide our services</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our service, including IP address, browser type, and pages visited</li>
              <li><strong>Cookies:</strong> We use cookies to maintain your session and improve your experience</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and send related information</li>
              <li>Send you marketing and promotional communications (with your consent)</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Disclosure of Your Information</h2>
            <p>We may share your information in the following situations:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> We may share your information with third parties that perform services on our behalf</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required by law or if we believe in good faith that disclosure is necessary</li>
              <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your information may be transferred</li>
              <li><strong>With Your Consent:</strong> We may share your information with third parties when you give us explicit consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at support@rocketeerio.com or through our website contact form.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date of this Privacy Policy. Your continued use of the service following the posting of revised Privacy Policy means that you accept and agree to the changes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
