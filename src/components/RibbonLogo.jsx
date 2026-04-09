import './RibbonLogo.css'

export function RibbonLogo() {
  // Möbius passes through the loops of the two d's.
  // Crossing CPs use ±(14,14) offset → 45° tangents, 90° crossing angle → smooth ribbon X.
  // All 4 junctions are exact mirror-reflections → fully smooth throughout.
  const infinityPath = [
    "M 44,44",
    "C 44,24 62,30 76,44",
    "C 90,58 98,64 98,44",
    "C 98,24 90,30 76,44",
    "C 62,58 44,64 44,44",
    "Z"
  ].join(" ")

  // Flipped: right-to-left arc is now the bright over-strand
  const strandOver = "M 98,44 C 98,24 90,30 76,44 C 62,58 44,64 44,44"
  const strandUnder = "M 44,44 C 44,24 62,30 76,44 C 90,58 98,64 98,44"

  return (
    <svg
      className="ribbon-logo"
      viewBox="0 0 140 72"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Puddle"
    >
      <defs>
        {/* Hardcoded colors for Safari SMIL compatibility */}
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="0%"
          gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="25%" stopColor="#39ff14" />
          <stop offset="50%" stopColor="#fff01f" />
          <stop offset="75%" stopColor="#ff00aa" />
          <stop offset="100%" stopColor="#00f0ff" />
        </linearGradient>

        {/* Animated gradient that flows along the ribbon */}
        <linearGradient id="tape-grad-anim" x1="0%" y1="0%" x2="100%" y2="0%"
          gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f0ff">
            <animate attributeName="stop-color"
              values="#00f0ff;#39ff14;#ff00aa;#fff01f;#00f0ff"
              dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="25%" stopColor="#39ff14">
            <animate attributeName="stop-color"
              values="#39ff14;#ff00aa;#fff01f;#00f0ff;#39ff14"
              dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#ff00aa">
            <animate attributeName="stop-color"
              values="#ff00aa;#fff01f;#00f0ff;#39ff14;#ff00aa"
              dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="75%" stopColor="#fff01f">
            <animate attributeName="stop-color"
              values="#fff01f;#00f0ff;#39ff14;#ff00aa;#fff01f"
              dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#00f0ff">
            <animate attributeName="stop-color"
              values="#00f0ff;#39ff14;#ff00aa;#fff01f;#00f0ff"
              dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>

        <filter id="tape-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="sparkle-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Letter strokes ── */}
      <g
        className="logo-letters"
        fill="none"
        stroke="url(#logo-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* p — descender stem + upper-right bowl */}
        <path d="M 10,28 L 10,62" />
        <path d="M 10,28 C 10,20 24,20 24,30 C 24,44 10,46 10,38" />

        {/* u */}
        <path d="M 30,28 L 30,50 C 30,58 42,58 42,50 L 42,28" />

        {/* first d stem — RIGHT side of left möbius loop (d = bowl left, stem right) */}
        <path d="M 76,10 L 76,58" />

        {/* second d stem — RIGHT side of right möbius loop */}
        <path d="M 98,10 L 98,58" />

        {/* l */}
        <path d="M 108,10 L 108,58" />

        {/* e — open arc with crossbar */}
        <path d="M 126,44 C 126,30 114,30 114,44 C 114,58 126,58 126,50" />
        <path d="M 114,44 L 124,44" />
      </g>

      {/* ── Möbius infinity ribbon ── */}

      {/* Wide glow aura */}
      <path
        d={infinityPath}
        fill="none"
        stroke="url(#tape-grad-anim)"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.12"
        filter="url(#tape-glow)"
      />

      {/* UNDER strand — the back side of the fold (dimmer, thinner) */}
      <path
        className="ribbon-under"
        d={strandUnder}
        fill="none"
        stroke="url(#tape-grad-anim)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Crossing bridge — covers the under strand at the fold point */}
      <ellipse cx="76" cy="44" rx="5" ry="4" fill="#0a0a12" />

      {/* OVER strand — the front side of the fold (bright, thicker) */}
      <path
        className="ribbon-over"
        d={strandOver}
        fill="none"
        stroke="url(#tape-grad-anim)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Shimmer highlight 1 — fast bright streak */}
      <path
        className="shimmer-1"
        d={infinityPath}
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Shimmer highlight 2 — slower, wider, colored */}
      <path
        className="shimmer-2"
        d={infinityPath}
        fill="none"
        stroke="url(#tape-grad-anim)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Sparkle particles along the ribbon */}
      <g className="sparkles" filter="url(#sparkle-glow)">
        <circle className="sparkle s1" cx="50" cy="34" r="1" fill="white" />
        <circle className="sparkle s2" cx="88" cy="54" r="0.8" fill="#00f0ff" />
        <circle className="sparkle s3" cx="96" cy="38" r="1" fill="#ff00aa" />
        <circle className="sparkle s4" cx="64" cy="58" r="0.8" fill="#39ff14" />
        <circle className="sparkle s5" cx="76" cy="44" r="1.2" fill="white" />
        <circle className="sparkle s6" cx="48" cy="50" r="0.7" fill="#fff01f" />
      </g>
    </svg>
  )
}
