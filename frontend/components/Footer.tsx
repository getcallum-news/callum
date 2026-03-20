/**
 * Site footer — understated, confident.
 * The kind of footer you'd find on a Monocle or FT page.
 */
export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-12">
      <div className="mx-auto max-w-4xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Brand */}
          <div>
            <p className="font-serif text-sm font-medium tracking-wide">
              Callum
            </p>
            <p className="mt-1 text-[11px] tracking-wide text-callum-muted">
              AI news, filtered. Worldwide.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="/privacy"
              className="hover-underline text-[11px] uppercase tracking-[0.1em] text-callum-muted transition-opacity hover:opacity-80"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="hover-underline text-[11px] uppercase tracking-[0.1em] text-callum-muted transition-opacity hover:opacity-80"
            >
              Terms
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-callum-muted opacity-50">
            &copy; {new Date().getFullYear()} Callum
          </p>
        </div>
      </div>
    </footer>
  );
}
