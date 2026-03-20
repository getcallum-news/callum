"use client";

import { useEffect, useState, useRef } from "react";

const SUBTITLES = [
  "Thousands of AI headlines a day. Most are noise. We keep the ten that actually matter.",
  "Your LinkedIn feed is crying. We gave it therapy.",
  "Because life's too short to read another GPT wrapper launch post.",
  "Saving you from the 47th 'AI will replace you' article today.",
  "We scroll through the chaos so your eyes don't have to bleed.",
  "Less hype. Less fluff. Less 'we're excited to announce.' More signal.",
  "All the AI news. None of the Twitter drama. Okay, maybe a little.",
  "Curated by algorithms that actually know what they're doing. Unlike most.",
  "The news your bookmarks folder wishes it had.",
  "No sponsored posts. No influencer takes. Just what happened.",
  "We filter out the noise, the grift, and the 'just vibes' research papers.",
  "Somewhere between doomscrolling and actually being informed.",
  "Like a morning briefing, but without the guy who won't stop talking about LangChain.",
];

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function HeroSubtitle() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [mounted, setMounted] = useState(false);
  const shuffledRef = useRef<string[]>(SUBTITLES);

  useEffect(() => {
    shuffledRef.current = shuffle(SUBTITLES);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % shuffledRef.current.length);
        setFade(true);
      }, 500);
    }, 8000);

    return () => clearInterval(interval);
  }, [mounted]);

  // Render a static first subtitle during SSR to avoid hydration mismatch
  const text = mounted ? shuffledRef.current[index] : SUBTITLES[0];

  return (
    <p
      className="animate-reveal-delay-2 mt-8 max-w-lg text-base leading-relaxed text-callum-muted sm:text-lg transition-opacity duration-500"
      style={{ opacity: fade ? 1 : 0 }}
    >
      {text}
    </p>
  );
}
