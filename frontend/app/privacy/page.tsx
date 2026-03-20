import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Callum",
};

/**
 * Privacy policy page.
 *
 * Covers what data we collect (minimal), how we use it, how to delete
 * it, and GDPR compliance. Applicable worldwide.
 */
export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-4xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-callum-muted">
          Last updated: January 2025
        </p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-callum-muted">
          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              What We Collect
            </h2>
            <p>
              Callum collects the minimum data necessary to provide push
              notifications. If you subscribe to notifications, we store:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Your browser&apos;s push notification endpoint URL</li>
              <li>Encryption keys required for sending push messages (p256dh and auth)</li>
            </ul>
            <p className="mt-3">
              We do not collect your name, email address, IP address, location,
              browsing history, or any other personal information. We do not use
              cookies for tracking. We do not run analytics.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              How We Use Your Data
            </h2>
            <p>
              Push notification subscription data is used solely to send you
              notifications when new AI articles arrive. We do not share, sell,
              or transfer this data to any third party. We do not use it for
              advertising, profiling, or any purpose other than delivering
              notifications.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              Data Storage
            </h2>
            <p>
              Subscription data is stored in a PostgreSQL database hosted on
              Supabase. Data is encrypted in transit (TLS) and at rest. We
              retain subscription records only while they are active. When you
              unsubscribe, the record is deactivated and no longer used.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              How to Delete Your Data
            </h2>
            <p>
              You can remove your data at any time by clicking the notification
              bell in the header and selecting &quot;Unsubscribe.&quot; This
              immediately deactivates your push subscription. If you would like
              your record permanently deleted, contact us at{" "}
              <a
                href="mailto:getcallum@gmail.com"
                className="underline underline-offset-4"
              >
                getcallum@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              GDPR Compliance
            </h2>
            <p>
              If you are located in the European Economic Area (EEA), you have
              the right to access, correct, or delete your personal data. Our
              legal basis for processing push notification data is your explicit
              consent, which you provide when subscribing to notifications. You
              may withdraw consent at any time by unsubscribing.
            </p>
            <p className="mt-3">
              For any data-related requests, contact us at{" "}
              <a
                href="mailto:getcallum@gmail.com"
                className="underline underline-offset-4"
              >
                getcallum@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              Third-Party Services
            </h2>
            <p>
              Callum uses the following third-party services to operate:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Supabase (database hosting)</li>
              <li>Render (backend hosting)</li>
              <li>Vercel (frontend hosting)</li>
              <li>Firebase Cloud Messaging (push notification delivery)</li>
              <li>Cloudflare (DNS and DDoS protection)</li>
            </ul>
            <p className="mt-3">
              Each of these services has its own privacy policy. We encourage
              you to review them.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. Changes will
              be posted on this page with an updated revision date. Continued
              use of Callum after changes constitutes acceptance of the revised
              policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              Contact
            </h2>
            <p>
              For questions about this privacy policy or your data, contact:{" "}
              <a
                href="mailto:getcallum@gmail.com"
                className="underline underline-offset-4"
              >
                getcallum@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
