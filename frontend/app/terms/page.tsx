import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Callum",
};

/**
 * Terms of service page.
 *
 * Clarifies what Callum is (aggregator, not publisher), our
 * relationship with original content sources, user responsibilities,
 * and service availability.
 */
export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-4xl font-semibold">Terms of Service</h1>
        <p className="mt-2 text-sm text-callum-muted">
          Last updated: January 2025
        </p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-callum-muted">
          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              What Callum Is
            </h2>
            <p>
              Callum is a news aggregation service that collects, filters, and
              displays links to AI-related news articles from publicly available
              sources. Callum is not a news publisher. We do not create original
              content. All articles are sourced from third-party publications,
              and we link directly to the original source for each article.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              Content and Copyright
            </h2>
            <p>
              Callum displays article titles and brief summaries (limited to
              1,000 characters) alongside links to the original articles. We do
              not reproduce, store, or display full article content. All
              intellectual property rights for the original content belong to
              the respective publishers.
            </p>
            <p className="mt-3">
              If you are a content owner and believe that Callum is displaying
              your content in a way that infringes your rights, please contact
              us at{" "}
              <a
                href="mailto:getcallum@gmail.com"
                className="underline underline-offset-4"
              >
                getcallum@gmail.com
              </a>{" "}
              and we will address your concern promptly.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              No Liability for External Content
            </h2>
            <p>
              Callum aggregates content from third-party sources and does not
              verify the accuracy, completeness, or reliability of any article.
              We are not responsible for the content, opinions, or claims made
              in articles linked from our platform. Users access external
              content at their own discretion and risk.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              User Responsibilities
            </h2>
            <p>By using Callum, you agree to:</p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Use the service for lawful purposes only</li>
              <li>
                Not attempt to disrupt, overload, or interfere with the
                service&apos;s operation
              </li>
              <li>
                Not scrape, crawl, or programmatically access the service beyond
                the published API rate limits
              </li>
              <li>
                Not misrepresent Callum&apos;s content as your own original work
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              Service Availability
            </h2>
            <p>
              Callum is provided &quot;as is&quot; without warranty of any kind.
              We strive to keep the service available and up to date, but we do
              not guarantee uninterrupted access, complete accuracy of the news
              filter, or that all relevant AI news will be captured. We reserve
              the right to modify, suspend, or discontinue the service at any
              time without notice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              Push Notifications
            </h2>
            <p>
              If you subscribe to push notifications, you consent to receiving
              periodic alerts about new AI articles. You can unsubscribe at any
              time using the notification bell in the header. See our{" "}
              <a href="/privacy" className="underline underline-offset-4">
                Privacy Policy
              </a>{" "}
              for details on how notification data is handled.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              Changes to These Terms
            </h2>
            <p>
              We may update these terms from time to time. Changes will be
              posted on this page with an updated revision date. Continued use
              of Callum after changes constitutes acceptance of the revised
              terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-medium text-[var(--text-primary)]">
              Contact
            </h2>
            <p>
              For questions about these terms, contact:{" "}
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
