/**
 * Callum logo icon — three horizontal lines decreasing in width.
 *
 * Represents a filter: wide input at the top, refined output at the
 * bottom. Uses currentColor so it adapts to dark/light mode.
 */

interface CallumIconProps {
  size?: number;
  className?: string;
}

export default function CallumIcon({ size = 24, className = "" }: CallumIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`logo-animated ${className}`}
      aria-label="Callum logo"
    >
      {/* Top line — full width, center-aligned */}
      <rect x="2" y="6" width="20" height="3" rx="0.5" fill="currentColor" />
      {/* Middle line — ~65% width, centered */}
      <rect x="5.5" y="11" width="13" height="3" rx="0.5" fill="currentColor" />
      {/* Bottom line — ~40% width, centered */}
      <rect x="8" y="16" width="8" height="3" rx="0.5" fill="currentColor" />
    </svg>
  );
}
