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
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close menu on route change or resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const toggleTheme = () => {
    if (transition) return;
    const next = !isDark;
    setTransition(next ? "to-dark" : "to-light");
  };

  const handleTransitionComplete = useCallback(() => {
    setIsDark(transition === "to-dark");
    setTransition(null);
  }, [transition]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/trending", label: "Trending" },
    { href: "/rewind", label: "Rewind" },
    { href: "/pulse", label: "Pulse" },
    { href: "/topics", label: "Topics" },
    { href: "/about", label: "About" },
  ];

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
            onClick={() => setMenuOpen(false)}
          >
            <CallumIcon size={24} />
            <span className="font-serif text-lg font-semibold tracking-[0.05em]">
              Callum
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-10 sm:flex">
            {navLinks.map(({ href, label }) => (
              <MagneticButton key={href}>
                <Link href={href} className="hover-underline text-[11px] font-medium uppercase tracking-[0.15em] opacity-60 transition-opacity hover:opacity-100">
                  {label}
                </Link>
              </MagneticButton>
            ))}
          </nav>

          {/* Right side — bell + theme toggle + mobile hamburger */}
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
                {/* Warm flame — visible in dark mode */}
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
                    transform: isDark ? "scale(1)" : "scale(0.6)",
                    filter: isDark ? "drop-shadow(0 0 4px rgba(245,158,11,0.4))" : "none",
                  }}
                >
                  <path d="M12 2c.5 3.5-1 6-3 8 1.5.5 3 2 3 5 0-3 1.5-4.5 3-5-2-2-3.5-4.5-3-8z" strokeLinejoin="round" />
                  <path d="M12 22a7 7 0 0 1-4-12.5c.5 2.5 2 4 4 4.5 2-.5 3.5-2 4-4.5A7 7 0 0 1 12 22z" strokeLinejoin="round" />
                </svg>

                {/* Moon crescent — visible in light mode */}
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
                    transform: isDark ? "scale(0.6)" : "scale(1)",
                    filter: !isDark ? "drop-shadow(0 0 4px rgba(120,140,255,0.4))" : "none",
                  }}
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
            </MagneticButton>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative flex h-8 w-8 items-center justify-center sm:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <span
                className="absolute h-[1.5px] w-4 rounded-full bg-current transition-all duration-300"
                style={{
                  transform: menuOpen ? "rotate(45deg)" : "translateY(-4px)",
                }}
              />
              <span
                className="absolute h-[1.5px] w-4 rounded-full bg-current transition-all duration-300"
                style={{
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span
                className="absolute h-[1.5px] w-4 rounded-full bg-current transition-all duration-300"
                style={{
                  transform: menuOpen ? "rotate(-45deg)" : "translateY(4px)",
                }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className="fixed inset-0 z-40 sm:hidden"
        style={{
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[var(--bg)] opacity-95"
          onClick={() => setMenuOpen(false)}
        />

        {/* Nav links */}
        <nav className="relative flex h-full flex-col items-center justify-center gap-8">
          {navLinks.map(({ href, label }, i) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="font-serif text-3xl font-semibold tracking-tight transition-all duration-300"
              style={{
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.3s ease ${i * 0.06 + 0.1}s, transform 0.3s ease ${i * 0.06 + 0.1}s`,
              }}
            >
              {label}
            </Link>
          ))}

          {/* Contact link in mobile menu */}
          <a
            href="mailto:contact@callumnews.com"
            className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-callum-muted transition-all duration-300"
            style={{
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(20px)",
              transition: `opacity 0.3s ease ${navLinks.length * 0.06 + 0.1}s, transform 0.3s ease ${navLinks.length * 0.06 + 0.1}s`,
            }}
          >
            contact@callumnews.com
          </a>
        </nav>
      </div>
    </>
  );
}
