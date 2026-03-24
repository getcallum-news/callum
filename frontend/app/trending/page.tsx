import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import ScrollProgress from "@/components/ScrollProgress";
import CustomCursor from "@/components/CustomCursor";
import TrendingContent from "@/components/TrendingContent";

export const metadata = {
  title: "Trending — Callum",
  description: "What the AI world is talking about right now. Topics ranked by mention count across all sources.",
};

export default function TrendingPage() {
  return (
    <div className="noise-overlay">
      <CustomCursor />
      <ScrollProgress />
      <Header />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:pt-40">
          <p className="animate-reveal mb-6 text-[11px] font-medium uppercase tracking-[0.3em] text-callum-muted">
            Trending Now
          </p>
          <h1 className="animate-reveal-delay-1 font-serif text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
            What the AI world
            <br />
            <span className="italic hero-gradient-text">can&apos;t stop talking about.</span>
          </h1>

          <p className="animate-reveal-delay-2 mt-8 max-w-xl text-[16px] leading-[1.8] text-callum-muted">
            Topics ranked by how often they appear across every source we track.
            Click any topic to see the articles driving the conversation.
          </p>

          <p className="animate-reveal-delay-3 mt-4 font-serif text-[15px] italic text-callum-muted opacity-60">
            Spoiler: it&apos;s probably OpenAI again.
          </p>

          <div className="mt-12 animate-line-grow w-full gradient-divider" />
        </section>

        {/* Trending content */}
        <TrendingContent />
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}
