import './RibbonLogo.css'

export function RibbonLogo() {
  // Möbius lemniscate — completely redesigned for smooth loops + crossing.
  //
  // Key insight: outer points (44,44) and (98,44) get pure-vertical tangents by
  // placing both CPs for each outer arc at the same y (apex). Crossing CPs are
  // exact reflections through (76,44) → all 4 junctions fully smooth.
  //
  // Left lobe:  (76,44) → upper arc via (60,26)+(44,26) → (44,44)
  //                      → lower arc via (44,62)+(60,62) → (76,44)
  // Right lobe: (76,44) → upper arc via (92,26)+(98,26) → (98,44)
  //                      → lower arc via (98,62)+(92,62) → (76,44)
  //
  // All smoothness checks: ✓ at (44,44), ✓ at (76,44)×2, ✓ at (98,44)
  const infinityPath = [
    "M 76,44",
    "C 60,26 44,26 44,44",
    "C 44,62 60,62 76,44",
    "C 92,26 98,26 98,44",
    "C 98,62 92,62 76,44",
    "Z"
  ].join(" ")

  // strandUnder: L→R, dips through lower-left then rises upper-right → S at crossing
  const strandUnder = "M 44,44 C 44,62 60,62 76,44 C 92,26 98,26 98,44"
  // strandOver:  R→L, dips through lower-right then rises upper-left → front of fold
  const strandOver  = "M 98,44 C 98,62 92,62 76,44 C 60,26 44,26 44,44"

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

        {/*
          Animated gradient — CSS keyframes shift the gradient x1/x2 positions.
          SMIL <animate> removed: Safari's SMIL implementation causes compositor
          thrashing and high CPU. The shimmer dash animations + CSS gradient shift
          provide equivalent visual motion with far better perf.
        */}
        <linearGradient id="tape-grad-anim" x1="0%" y1="0%" x2="100%" y2="0%"
          gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="20%" stopColor="#39ff14" />
          <stop offset="40%" stopColor="#ff00aa" />
          <stop offset="60%" stopColor="#fff01f" />
          <stop offset="80%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#39ff14" />
        </linearGradient>

        {/*
          SVG feGaussianBlur filters removed — Safari recomputes these every frame
          for any animated child, causing severe compositor overhead.
          Glow effect moved to CSS drop-shadow on the SVG element instead.
        */}
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
        className="tape-glow-path"
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
      <ellipse cx="76" cy="44" rx="6" ry="8" fill="#0a0a12" />

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
      <g className="sparkles">
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
