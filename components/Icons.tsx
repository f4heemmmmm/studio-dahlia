export function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 0C12.9 7.6 16.4 11.1 24 12C16.4 12.9 12.9 16.4 12 24C11.1 16.4 7.6 12.9 0 12C7.6 11.1 11.1 7.6 12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Pearls along the centre line of the tiara's curved band
const BAND_PEARLS = [
  [25.1, 70.7], [34.3, 72.2], [43.4, 73.4], [52.6, 74.3], [61.7, 75.0], [70.9, 75.4], [80.0, 75.5],
  [89.1, 75.4], [98.3, 75.0], [107.4, 74.3], [116.6, 73.4], [125.7, 72.2], [134.9, 70.7],
];

// Open filigree arches (outer outline + inner cut-out, filled even-odd), left to right
const ARCHES = [
  "M16 66C17 58 21 52 26 47C31 52 35 58 36 66ZM19 65C20 59 22.5 54.5 26 50.5C29.5 54.5 32 59 33 65Z",
  "M36 66C38 55 44 45 50 37C56 45 62 55 64 66ZM40 64C42 55 46 48 50 41.5C54 48 58 55 60 64Z",
  "M62 67C64 51 72 38 80 23C88 38 96 51 98 67ZM67 65C69 52 74 42 80 29.5C86 42 91 52 93 65Z",
  "M96 66C98 55 104 45 110 37C116 45 122 55 124 66ZM100 64C102 55 106 48 110 41.5C114 48 118 55 120 64Z",
  "M124 66C125 58 129 52 134 47C139 52 143 58 144 66ZM127 65C128 59 130.5 54.5 134 50.5C137.5 54.5 140 59 141 65Z",
];

export function Tiara({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 84" aria-hidden="true">
      <defs>
        <linearGradient id="tiara-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBF0D6" />
          <stop offset="0.45" stopColor="#E6C88F" />
          <stop offset="0.8" stopColor="#C49C5C" />
          <stop offset="1" stopColor="#A9824A" />
        </linearGradient>
        <radialGradient id="tiara-gem" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFF1F5" />
          <stop offset="0.45" stopColor="#F2A6BC" />
          <stop offset="1" stopColor="#C2567D" />
        </radialGradient>
        <radialGradient id="tiara-pearl" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.6" stopColor="#F5EDE7" />
          <stop offset="1" stopColor="#D6C5B8" />
        </radialGradient>
      </defs>

      <g stroke="#9C7A45" strokeWidth="0.6" strokeLinejoin="round">
        {/* Filigree arches */}
        {ARCHES.map((d) => (
          <path key={d} d={d} fill="url(#tiara-gold)" fillRule="evenodd" />
        ))}
        {/* Scrolls between the arches */}
        <g fill="none" stroke="url(#tiara-gold)" strokeWidth="1.4" strokeLinecap="round">
          <path d="M33 62c0-5 4-7 6-4" />
          <path d="M127 62c0-5-4-7-6-4" />
          <path d="M60 62c0-6 5-8 7-4" />
          <path d="M100 62c0-6-5-8-7-4" />
        </g>
        {/* Curved band */}
        <path d="M16 66Q80 79 144 66L144 72Q80 85 16 72Z" fill="url(#tiara-gold)" />
      </g>

      {/* Pearls on the band */}
      {BAND_PEARLS.map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="2.1" fill="url(#tiara-pearl)" stroke="#CBB8A8" strokeWidth="0.4" />
      ))}

      {/* Pearl finials on the side arches */}
      <g fill="url(#tiara-pearl)" stroke="#CBB8A8" strokeWidth="0.4">
        <circle cx="26" cy="44.5" r="2.4" />
        <circle cx="134" cy="44.5" r="2.4" />
        <circle cx="50" cy="33.5" r="2.9" />
        <circle cx="110" cy="33.5" r="2.9" />
        {/* Where the arches meet the band */}
        <circle cx="36" cy="63.6" r="1.9" />
        <circle cx="63" cy="64.4" r="1.9" />
        <circle cx="97" cy="64.4" r="1.9" />
        <circle cx="124" cy="63.6" r="1.9" />
      </g>

      {/* Rose gems: diamond-cut crown jewel, hanging teardrop, side stones */}
      <g fill="url(#tiara-gem)" stroke="#9C7A45" strokeWidth="0.7" strokeLinejoin="round">
        <path d="M80 7L85.5 15L80 24.5L74.5 15Z" />
        <path d="M80 39C84 45 87 49 87 52.5A7 7 0 0 1 73 52.5C73 49 76 45 80 39Z" />
        <circle cx="50" cy="54" r="3.2" />
        <circle cx="110" cy="54" r="3.2" />
        <circle cx="26" cy="59" r="2.3" />
        <circle cx="134" cy="59" r="2.3" />
      </g>

      {/* Facet highlights */}
      <g fill="#FFFFFF" opacity="0.85">
        <path d="M80 10L82.3 15L80 13.6L77.7 15Z" />
        <ellipse cx="77.6" cy="49.5" rx="1.6" ry="2.4" transform="rotate(-20 77.6 49.5)" />
      </g>
    </svg>
  );
}

export function TikTok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 7.917v4.034a9.948 9.948 0 0 1-5-1.951v4.5a6.5 6.5 0 1 1-8-6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Instagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r=".8" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
