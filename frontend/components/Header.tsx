"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CallumIcon from "./CallumIcon";
import NotificationBell from "./NotificationBell";
import ThemeTransition from "./ThemeTransition";
import MagneticButton from "./MagneticButton";

export default function Header() {
  const [isDark, setIsDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [transition, setTransition] = useState<"to-light" | "to-dark" | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("callum-theme");
    if (saved === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    if (transition) return; // Don't allow double-click during animation
    const next = !isDark;
    setTransition(next ? "to-dark" : "to-light");
  };

  const handleTransitionComplete = useCallback(() => {
    // Theme was already switched inside ThemeTransition at phase 2
    // Just sync React state here
    setIsDark(transition === "to-dark");
    setTransition(null);
  }, [transition]);

  return (
    <>
      {/* Theme transition overlay */}
      {transition && (
        <ThemeTransition
          toLight={transition === "to-light"}
          onComplete={handleTransitionComplete}
        />
      )}

      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass-header border-b border-[var(--border)]"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          {/* Logo + wordmark */}
          <Link
            href="/"
            className="group flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <CallumIcon size={24} />
            <span className="font-serif text-lg font-semibold tracking-[0.05em]">
              Callum
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6 sm:gap-10">
            <MagneticButton>
              <Link href="/" className="hover-underline text-[11px] font-medium uppercase tracking-[0.15em] opacity-60 transition-opacity hover:opacity-100">
                Home
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link href="/trending" className="hover-underline text-[11px] font-medium uppercase tracking-[0.15em] opacity-60 transition-opacity hover:opacity-100">
                Trending
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link href="/rewind" className="hover-underline text-[11px] font-medium uppercase tracking-[0.15em] opacity-60 transition-opacity hover:opacity-100">
                Rewind
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link href="/about" className="hover-underline text-[11px] font-medium uppercase tracking-[0.15em] opacity-60 transition-opacity hover:opacity-100">
                About
              </Link>
            </MagneticButton>
          </nav>

          {/* Right side — bell + theme toggle */}
          <div className="flex items-center gap-3">
            <MagneticButton strength={0.4}>
              <NotificationBell />
            </MagneticButton>

            <MagneticButton strength={0.4}>
            <button
              onClick={toggleTheme}
              className="relative p-2 opacity-50 transition-all duration-300 hover:opacity-100"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {/* Sun icon — visible in dark mode */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="absolute inset-0 m-auto transition-all duration-500"
                style={{
                  opacity: isDark ? 1 : 0,
                  transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.5)",
                }}
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>

              {/* Moon icon — visible in light mode */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="transition-all duration-500"
                style={{
                  opacity: isDark ? 0 : 1,
                  transform: isDark ? "rotate(-90deg) scale(0.5)" : "rotate(0deg) scale(1)",
                }}
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
            </MagneticButton>
          </div>
        </div>
      </header>
    </>
  );
}
