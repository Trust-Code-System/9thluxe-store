import { cn } from "@/lib/utils"

/**
 * Original Fádé flacon: a layered SVG glass bottle used for cinematic
 * staging (hero, story moments). Pure vector: no stock photography,
 * scales crisply, and picks its palette up from CSS variables.
 */
export function Flacon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 460"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", className)}
      role="img"
      aria-label="Fádé perfume flacon"
    >
      <defs>
        {/* Liquid: plum wine settling into amber light */}
        <linearGradient id="flacon-liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a4a5c" stopOpacity="0.92" />
          <stop offset="45%" stopColor="#5c2b3a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#2e1620" />
        </linearGradient>
        {/* Glass walls */}
        <linearGradient id="flacon-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e7d4bb" stopOpacity="0.28" />
          <stop offset="12%" stopColor="#e7d4bb" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#e7d4bb" stopOpacity="0.02" />
          <stop offset="88%" stopColor="#e7d4bb" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#e7d4bb" stopOpacity="0.32" />
        </linearGradient>
        {/* Cap brushed metal */}
        <linearGradient id="flacon-cap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a2d24" />
          <stop offset="30%" stopColor="#4a4e3e" />
          <stop offset="50%" stopColor="#6b6f58" />
          <stop offset="70%" stopColor="#3c4032" />
          <stop offset="100%" stopColor="#23261e" />
        </linearGradient>
        <linearGradient id="flacon-collar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a7b63" />
          <stop offset="45%" stopColor="#cbb99a" />
          <stop offset="60%" stopColor="#8a7b63" />
          <stop offset="100%" stopColor="#5f5443" />
        </linearGradient>
        {/* Caustic light pooling through the glass */}
        <radialGradient id="flacon-caustic" cx="0.5" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#e7d4bb" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#c09ea9" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#e7d4bb" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cap */}
      <rect x="118" y="14" width="64" height="74" rx="6" fill="url(#flacon-cap)" />
      <rect x="118" y="14" width="64" height="74" rx="6" stroke="#e7d4bb" strokeOpacity="0.14" />
      {/* Collar */}
      <rect x="128" y="88" width="44" height="18" rx="2" fill="url(#flacon-collar)" />

      {/* Body: soft-shouldered flacon */}
      <path
        d="M96 130
           C96 116 110 106 128 106
           L172 106
           C190 106 204 116 204 130
           L216 350
           C218 390 190 420 150 420
           C110 420 82 390 84 350
           Z"
        fill="url(#flacon-glass)"
        stroke="#e7d4bb"
        strokeOpacity="0.22"
        strokeWidth="1.4"
      />

      {/* Liquid fill */}
      <path
        d="M92.5 196 L207.5 196 L216 350 C218 390 190 420 150 420 C110 420 82 390 84 350 Z"
        fill="url(#flacon-liquid)"
      />
      {/* Liquid surface ellipse */}
      <ellipse cx="150" cy="196" rx="57.5" ry="7" fill="#a96475" opacity="0.55" />

      {/* Caustic glow inside glass */}
      <ellipse cx="150" cy="300" rx="70" ry="110" fill="url(#flacon-caustic)" opacity="0.5" />

      {/* Tall left highlight */}
      <path
        d="M108 140 C104 200 100 300 106 380"
        stroke="#f4ead9"
        strokeOpacity="0.4"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Short right highlight */}
      <path
        d="M196 150 C199 190 201 240 200 280"
        stroke="#f4ead9"
        strokeOpacity="0.18"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Etched label */}
      <g>
        <rect x="112" y="250" width="76" height="44" fill="#111310" opacity="0.28" />
        <rect x="112" y="250" width="76" height="44" stroke="#e7d4bb" strokeOpacity="0.35" strokeWidth="0.8" fill="none" />
        <text
          x="150"
          y="270"
          textAnchor="middle"
          fill="#efe4d0"
          fontSize="13"
          letterSpacing="6"
          style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
        >
          FÁDÉ
        </text>
        <text
          x="150"
          y="285"
          textAnchor="middle"
          fill="#c9bda5"
          fontSize="6"
          letterSpacing="2.6"
          style={{ fontFamily: "var(--font-plex-mono), monospace" }}
        >
          EAU DE PARFUM
        </text>
      </g>
    </svg>
  )
}
