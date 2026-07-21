/**
 * Original CSS/SVG mark for AssetScout AI: a faceted "asset" polygon with a
 * scan/search accent line. No external icon assets.
 */
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="2" y1="2" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="55%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <path
          d="M15 2L27 8.5V21.5L15 28L3 21.5V8.5L15 2Z"
          fill="url(#logo-gradient)"
          fillOpacity="0.18"
          stroke="url(#logo-gradient)"
          strokeWidth="1.5"
        />
        <path
          d="M15 2V28M3 8.5L15 15L27 8.5M3 21.5L15 15L27 21.5"
          stroke="url(#logo-gradient)"
          strokeWidth="1.1"
          strokeLinejoin="round"
          strokeOpacity="0.55"
        />
        <circle cx="15" cy="15" r="3.2" fill="#05070d" stroke="url(#logo-gradient)" strokeWidth="1.4" />
      </svg>
      <span className="flex items-baseline gap-1 font-semibold tracking-tight">
        <span className="text-[var(--foreground)]">AssetScout</span>
        <span className="bg-gradient-to-r from-accent-blue via-accent-cyan to-accent-purple bg-clip-text text-transparent">
          AI
        </span>
      </span>
    </span>
  );
}
