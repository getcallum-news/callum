import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import ScrollProgress from "@/components/ScrollProgress";
import CustomCursor from "@/components/CustomCursor";

export const metadata = {
  title: "About — Callum",
  description: "What Callum is, why it exists, and how it works.",
};

export default function AboutPage() {
  return (
    <div className="noise-overlay">
      <CustomCursor />
      <ScrollProgress />
      <Header />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:pt-40">
          <p className="animate-reveal mb-6 text-[11px] font-medium uppercase tracking-[0.3em] text-callum-muted">
            About
          </p>
          <h1 className="animate-reveal-delay-1 font-serif text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
            A quieter way
            <br />
            <span className="italic">to stay informed.</span>
          </h1>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-4xl px-6">
          <div className="animate-line-grow h-px w-full bg-[var(--border)]" />
        </div>

        {/* What & Why */}
        <section className="mx-auto max-w-4xl px-6 py-20">
          <div className="grid gap-16 sm:grid-cols-2">
            <div>
              <h2 className="mb-6 text-[11px] font-medium uppercase tracking-[0.3em] text-callum-muted">
                What is this
              </h2>
              <p className="text-[15px] leading-[1.9] text-callum-muted">
                Callum scans hundreds of sources every 30 minutes — research
                papers, industry blogs, tech press, Hacker News, arXiv — and
                runs everything through a relevance filter. If it&apos;s not
                genuinely about AI, it doesn&apos;t make it here.
              </p>
            </div>
            <div>
              <h2 className="mb-6 text-[11px] font-medium uppercase tracking-[0.3em] text-callum-muted">
                Why it exists
              </h2>
              <p className="text-[15px] leading-[1.9] text-callum-muted">
                No ads. No algorithmic engagement traps. No &ldquo;Top 10 AI
                Tools That Will Change Your Life.&rdquo; Just the stories that
                actually move the field forward, presented without the noise.
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-4xl px-6">
          <div className="h-px w-full bg-[var(--border)]" />
        </div>

        {/* How it works */}
        <section className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="mb-12 text-[11px] font-medium uppercase tracking-[0.3em] text-callum-muted">
            How it works
          </h2>
          <div className="grid gap-px border border-[var(--border)] sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Scan",
                desc: "Every 30 minutes, Callum pulls from RSS feeds, Hacker News, arXiv, and major tech publications. Hundreds of articles, scraped clean.",
              },
              {
                step: "02",
                title: "Filter",
                desc: "A keyword-based relevance engine scores each article. Core AI terms, model names, research topics — if the score's too low, it's gone.",
              },
              {
                step: "03",
                title: "Deliver",
                desc: "What survives gets categorised — Research, Industry, Tools, Safety — and served. No ranking tricks. Newest first. That's it.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="card-tilt border border-[var(--border)] px-8 py-10"
              >
                <p className="text-[11px] tracking-[0.2em] text-callum-muted">
                  {step}
                </p>
                <h3 className="mt-3 font-serif text-2xl font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-4 text-[14px] leading-[1.8] text-callum-muted">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-4xl px-6">
          <div className="h-px w-full bg-[var(--border)]" />
        </div>

        {/* Stats */}
        <section className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="mb-12 text-[11px] font-medium uppercase tracking-[0.3em] text-callum-muted">
            By the numbers
          </h2>
          <div className="grid grid-cols-2 gap-px border border-[var(--border)] sm:grid-cols-4">
            {[
              { number: "500+", label: "Sources scanned" },
              { number: "30m", label: "Refresh cycle" },
              { number: "0", label: "Tracking cookies" },
              { number: "∞", label: "Hot takes filtered out" },
            ].map(({ number, label }) => (
              <div
                key={label}
                className="card-tilt border border-[var(--border)] px-6 py-8 text-center"
              >
                <p className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                  {number}
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-callum-muted">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-4xl px-6">
          <div className="h-px w-full bg-[var(--border)]" />
        </div>

        {/* Closing */}
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="font-serif text-2xl font-semibold italic leading-relaxed tracking-tight sm:text-3xl">
            &ldquo;The best news app is the one that shows you less.&rdquo;
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-callum-muted">
            — Literally no one, but we believe it anyway
          </p>
        </section>
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}
