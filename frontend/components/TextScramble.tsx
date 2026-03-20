"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Text scramble effect — letters shuffle through random characters
 * before settling on the target text (airport departure board style).
 */

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

function scrambleStep(
  target: string,
  progress: number
): string {
  return target
    .split("")
    .map((char, i) => {
      if (char === " ") return " ";
      // Characters settle left-to-right based on progress
      const charProgress = (progress * target.length - i) / 3;
      if (charProgress >= 1) return char;
      if (charProgress <= 0) return CHARS[Math.floor(Math.random() * CHARS.length)];
      // Transitioning — mix of random and target
      return Math.random() > charProgress
        ? CHARS[Math.floor(Math.random() * CHARS.length)]
        : char;
    })
    .join("");
}

export default function TextScramble({
  texts,
  className = "",
  interval = 6000,
  scrambleDuration = 1200,
}: {
  texts: string[];
  className?: string;
  interval?: number;
  scrambleDuration?: number;
}) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Initial text — scramble in
    const target = texts[0];
    let start: number | null = null;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / scrambleDuration, 1);

      setDisplayText(scrambleStep(target, progress));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cycle through texts
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % texts.length;
      const target = texts[nextIndex];
      let start: number | null = null;

      const animate = (timestamp: number) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / scrambleDuration, 1);

        setDisplayText(scrambleStep(target, progress));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animate);
      setCurrentIndex(nextIndex);
    }, interval);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentIndex, texts, interval, scrambleDuration]);

  return (
    <span className={className} aria-live="polite">
      {displayText}
    </span>
  );
}
