"use client";

import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number | null;
}

export default function SearchBar({ value, onChange, resultCount }: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K to focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && focused) {
        inputRef.current?.blur();
        onChange("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focused, onChange]);

  return (
    <div
      className={`relative flex items-center gap-3 border transition-all duration-300 rounded px-4 py-2.5 ${
        focused
          ? "border-[var(--text-primary)]"
          : "border-[var(--border)] hover:border-callum-muted"
      }`}
    >
      {/* Search icon */}
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="shrink-0 text-callum-muted"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search articles…"
        className="w-full bg-transparent text-[13px] tracking-wide placeholder-callum-muted outline-none"
        aria-label="Search articles"
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="shrink-0 text-callum-muted transition-opacity hover:opacity-100 opacity-60"
          aria-label="Clear search"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Kbd hint when empty + not focused */}
      {!value && !focused && (
        <kbd className="shrink-0 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-callum-muted font-mono">
          ⌘K
        </kbd>
      )}

      {/* Result count when searching */}
      {value && resultCount !== null && resultCount !== undefined && (
        <span className="shrink-0 text-[11px] text-callum-muted whitespace-nowrap">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
