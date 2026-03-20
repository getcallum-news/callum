import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import ScrollProgress from "@/components/ScrollProgress";
import CustomCursor from "@/components/CustomCursor";
import RewindContent from "@/components/RewindContent";

export const metadata = {
  title: "Rewind — Callum",
  description: "Your weekly recap of everything that happened in AI. We read it. You didn't have to.",
};

export default function RewindPage() {
  return (
    <div className="noise-overlay">
      <CustomCursor />
      <ScrollProgress />
      <Header />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:pt-40">
          <p className="animate-reveal mb-6 text-[11px] font-medium uppercase tracking-[0.3em] text-callum-muted">
            Weekly Rewind
          </p>
          <h1 className="animate-reveal-delay-1 font-serif text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
            Everything that moved
            <br />
            <span className="italic hero-gradient-text">AI this week.</span>
          </h1>

          {/* Description */}
          <p className="animate-reveal-delay-2 mt-8 max-w-xl text-[16px] leading-[1.8] text-callum-muted">
            Top stories, biggest sources, category breakdown, and the general
            mood of a field that never stops having opinions about itself.
          </p>

          {/* Sarcastic subheading */}
          <p className="animate-reveal-delay-3 mt-4 font-serif text-[15px] italic text-callum-muted opacity-60">
            Because apparently &ldquo;I&apos;ll catch up on weekends&rdquo; is a personality trait now.
          </p>

          <div className="mt-12 animate-line-grow w-full gradient-divider" />
        </section>

        {/* Dynamic rewind content */}
        <RewindContent />
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}
