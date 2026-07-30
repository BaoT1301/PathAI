/**
 * PathAI custom logomark.
 *
 * A single, simple geometric mark: an ascending route with an origin dot and a
 * destination node, evoking a career "path" moving upward. Monochrome via
 * `currentColor` so it works white-on-dark (header/footer black square) and
 * dark-on-light. Replaces the borrowed lucide "Navigation" compass glyph.
 */
export function PathMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* ascending route */}
      <path d="M4 19.5 L9.5 14 L13.5 16 L20 8.5" />
      {/* destination node */}
      <circle cx="20" cy="8.5" r="2.3" fill="currentColor" stroke="none" />
      {/* origin node */}
      <circle cx="4" cy="19.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Full lockup: the mark in a rounded tile + the wordmark. Reuses the existing
 * app treatment (dark tile, light glyph). Use where a complete logo is wanted;
 * for bespoke placements, use <PathMark /> directly.
 */
export function Logo({
  className = "",
  markClassName = "",
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span
        className={`flex items-center justify-center rounded-lg bg-black dark:bg-white ${markClassName || "w-8 h-8"}`}
      >
        <PathMark className="w-[62%] h-[62%] text-white dark:text-black" />
      </span>
      {showWordmark && (
        <span className="text-xl font-black tracking-tighter text-black dark:text-white">
          PathAI
        </span>
      )}
    </span>
  );
}
