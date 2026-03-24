import Header from "@/components/Header";
import NewsFeed from "@/components/NewsFeed";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import CustomCursor from "@/components/CustomCursor";
import IntroSplash from "@/components/IntroSplash";
import NewsTicker from "@/components/NewsTicker";
import HeroSubtitle from "@/components/HeroSubtitle";
import LiveCounter from "@/components/LiveCounter";
import SourceMap from "@/components/SourceMap";
import ParallaxHero from "@/components/ParallaxHero";
import ScrollReveal from "@/components/ScrollReveal";
import MagneticButton from "@/components/MagneticButton";
import dynamic from "next/dynamic";
const StarryNight = dynamic(() => import("@/components/StarryNight"), { ssr: false });
const SunlitDust = dynamic(() => import("@/components/SunlitDust"), { ssr: false });
const GradientMesh = dynamic(() => import("@/components/GradientMesh"), { ssr: false });

export default function Home() {
  return (
    <div className="noise-overlay">
      <StarryNight />
      <SunlitDust />
      <IntroSplash />
      <CustomCursor />
      <ScrollProgress />
      <Header />

      <main>
        {/* Breaking news ticker */}
        <NewsTicker />

        {/* Hero section with parallax + gradient mesh */}
        <ParallaxHero>
          <section className="relative mx-auto max-w-4xl px-6 pb-20 pt-32 sm:pt-40">
            <GradientMesh />
            <div data-parallax="0.08" className="relative z-10">
              <div className="animate-reveal">
                <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-callum-muted">
                  Artificial Intelligence
                </p>
              </div>
            </div>
            <div data-parallax="0.12" className="relative z-10">
              {/* Glow accent behind title */}
              <div className="hero-glow absolute -left-10 top-1/2 -translate-y-1/2 w-[120%] h-[150%] pointer-events-none" aria-hidden="true" />
              <h1 className="relative animate-reveal-delay-1 font-serif text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                We read the internet
                <br />
                <span className="italic hero-gradient-text">so you don&apos;t have to.</span>
              </h1>
            </div>
            <div data-parallax="0.06" className="relative z-10">
              <HeroSubtitle />
            </div>

            <div className="mt-12 animate-line-grow w-full gradient-divider relative z-10" />

            <div className="animate-reveal-delay-3 mt-12 relative z-10" data-parallax="0.04">
              <MagneticButton as="a" href="#feed" className="group inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-callum-muted transition-all hover:text-[var(--text-primary)]">
                <span>Latest stories</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="transition-transform group-hover:translate-y-1"
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </MagneticButton>
            </div>
          </section>
        </ParallaxHero>

        {/* Gradient divider */}
        <div className="mx-auto max-w-4xl px-6">
          <div className="gradient-divider w-full" />
        </div>

        {/* Live counter — scanned vs kept */}
        <ScrollReveal>
          <LiveCounter />
        </ScrollReveal>

        {/* Gradient divider */}
        <div className="mx-auto max-w-4xl px-6">
          <div className="gradient-divider w-full" />
        </div>

        {/* Source map */}
        <ScrollReveal delay={0.1}>
          <SourceMap />
        </ScrollReveal>

        {/* Gradient divider */}
        <div className="mx-auto max-w-4xl px-6">
          <div className="gradient-divider w-full" />
        </div>

        {/* News feed */}
        <div id="feed" className="pt-12">
          <NewsFeed />
        </div>
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}
