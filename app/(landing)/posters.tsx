import type { ReactNode } from "react";

/**
 * Generated poster art for the landing page. Every tile is drawn here from
 * flat shapes and palette colours; no film or show artwork is used. Titles are
 * the made-up (or public-domain) titles from the demo library plus invented ones.
 */

type Palette = {
  bg1: string;
  bg2: string;
  a: string;
  b: string;
  c: string;
};

const PALETTES: Palette[] = [
  { bg1: "#34183f", bg2: "#7c3070", a: "#f08db4", b: "#efe3d3", c: "#b79ae0" },
  { bg1: "#10263a", bg2: "#245c6e", a: "#9ccdb5", b: "#efe3d3", c: "#ee86b0" },
  { bg1: "#271f4e", bg2: "#5a4698", a: "#c9b6f2", b: "#ee86b0", c: "#efe3d3" },
  { bg1: "#481730", bg2: "#8c2f58", a: "#f2a0bf", b: "#efe3d3", c: "#b79ae0" },
  { bg1: "#1d3a32", bg2: "#4d7a68", a: "#efe6d2", b: "#e98bb0", c: "#a8dcc4" },
  { bg1: "#1b2b4b", bg2: "#3d5a96", a: "#a9c4f0", b: "#efe3d3", c: "#ee86b0" },
  { bg1: "#e6d8c4", bg2: "#c9a9b8", a: "#4a2352", b: "#c24a82", c: "#f6efe3" },
];

type Motif = (p: Palette) => ReactNode;

const MOTIFS: Motif[] = [
  // sun over hills
  (p) => (
    <>
      <circle cx="100" cy="112" fill={p.a} r="46" />
      <path
        d="M0 214 Q50 160 110 200 T200 176 V300 H0Z"
        fill={p.c}
        opacity=".85"
      />
      <path
        d="M0 240 Q70 196 130 236 T200 216 V300 H0Z"
        fill={p.bg1}
        opacity=".9"
      />
    </>
  ),
  // skyline and moon
  (p) => (
    <>
      <circle cx="146" cy="70" fill={p.b} r="22" />
      {[
        [10, 150, 30],
        [42, 120, 26],
        [70, 170, 24],
        [96, 104, 30],
        [128, 146, 26],
        [156, 128, 34],
      ].map(([x, y, w]) => (
        <g key={x}>
          <rect fill={p.bg1} height={300 - y} width={w} x={x} y={y} />
          <rect
            fill={p.a}
            height="5"
            opacity=".8"
            width="5"
            x={x + 6}
            y={y + 12}
          />
          <rect
            fill={p.a}
            height="5"
            opacity=".6"
            width="5"
            x={x + 15}
            y={y + 28}
          />
        </g>
      ))}
    </>
  ),
  // waves under a low sun
  (p) => (
    <>
      <circle cx="100" cy="150" fill={p.b} r="36" />
      {[168, 188, 208, 228].map((y, i) => (
        <path
          d={`M0 ${y} Q25 ${y - 12} 50 ${y} T100 ${y} T150 ${y} T200 ${y} V300 H0Z`}
          fill={i % 2 ? p.c : p.bg1}
          key={y}
          opacity={0.9 - i * 0.12}
        />
      ))}
    </>
  ),
  // arch doorway
  (p) => (
    <>
      <path d="M52 250 V130 a48 48 0 0 1 96 0 V250Z" fill={p.a} />
      <path d="M72 250 V134 a28 28 0 0 1 56 0 V250Z" fill={p.bg1} />
      {[0, 1, 2, 3].map((i) => (
        <rect
          fill={p.b}
          height="6"
          key={i}
          opacity={0.8 - i * 0.15}
          width={56 + i * 18}
          x={72 - i * 9}
          y={232 + i * 8}
        />
      ))}
    </>
  ),
  // layered mountains
  (p) => (
    <>
      <circle cx="60" cy="86" fill={p.b} r="18" />
      <path
        d="M-10 230 L70 110 L130 190 L160 150 L214 230Z"
        fill={p.c}
        opacity=".9"
      />
      <path
        d="M-10 262 L50 170 L110 238 L170 176 L214 250 V300 H-10Z"
        fill={p.a}
        opacity=".85"
      />
      <path d="M-10 290 L70 226 L150 280 L214 240 V300 H-10Z" fill={p.bg1} />
    </>
  ),
  // orbits
  (p) => (
    <>
      {[84, 62, 40].map((r, i) => (
        <circle
          cx="100"
          cy="132"
          fill="none"
          key={r}
          r={r}
          stroke={i === 1 ? p.a : p.c}
          strokeWidth="3"
          opacity=".8"
        />
      ))}
      <circle cx="100" cy="132" fill={p.b} r="16" />
      <circle cx="162" cy="132" fill={p.a} r="9" />
      <circle cx="58" cy="90" fill={p.c} r="6" />
    </>
  ),
  // diagonal bands
  (p) => (
    <>
      <path d="M-20 80 L220 -20 L220 30 L-20 130Z" fill={p.a} />
      <path d="M-20 140 L220 40 L220 90 L-20 190Z" fill={p.b} opacity=".9" />
      <path d="M-20 200 L220 100 L220 150 L-20 250Z" fill={p.c} opacity=".85" />
    </>
  ),
  // eye
  (p) => (
    <>
      <path d="M20 140 Q100 60 180 140 Q100 220 20 140Z" fill={p.b} />
      <circle cx="100" cy="140" fill={p.a} r="34" />
      <circle cx="100" cy="140" fill={p.bg1} r="15" />
      <circle cx="109" cy="131" fill={p.b} r="5" />
    </>
  ),
  // crescent and stars
  (p) => (
    <>
      <circle cx="100" cy="130" fill={p.b} r="52" />
      <circle cx="122" cy="116" fill={p.bg2} r="46" />
      {[
        [40, 60],
        [160, 210],
        [152, 52],
        [56, 196],
        [34, 130],
      ].map(([x, y]) => (
        <circle cx={x} cy={y} fill={p.a} key={`${x}-${y}`} r="3" />
      ))}
    </>
  ),
  // rain and umbrella
  (p) => (
    <>
      {Array.from({ length: 14 }, (_, i) => (
        <line
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative art
          key={i}
          opacity=".5"
          stroke={p.c}
          strokeWidth="2"
          x1={10 + i * 14}
          x2={2 + i * 14}
          y1={10 + (i % 4) * 22}
          y2={44 + (i % 4) * 22}
        />
      ))}
      <path d="M40 150 a60 60 0 0 1 120 0Z" fill={p.a} />
      <line stroke={p.b} strokeWidth="4" x1="100" x2="100" y1="150" y2="214" />
      <path
        d="M100 214 a10 10 0 0 1 -20 0"
        fill="none"
        stroke={p.b}
        strokeWidth="4"
      />
    </>
  ),
  // lighthouse
  (p) => (
    <>
      <path d="M100 118 L220 70 L220 150Z" fill={p.b} opacity=".35" />
      <path d="M82 240 L92 120 H108 L118 240Z" fill={p.b} />
      <rect fill={p.a} height="14" width="14" x="93" y="150" />
      <rect fill={p.a} height="14" width="16" x="92" y="190" />
      <rect fill={p.bg1} height="18" width="26" x="87" y="102" />
      <path
        d="M0 250 Q50 236 100 250 T200 246 V300 H0Z"
        fill={p.c}
        opacity=".8"
      />
    </>
  ),
  // split circle and grid
  (p) => (
    <>
      <path d="M100 56 a64 64 0 0 1 0 128Z" fill={p.a} />
      <path d="M100 56 a64 64 0 0 0 0 128Z" fill={p.b} />
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          opacity=".5"
          stroke={p.c}
          strokeWidth="2"
          x1="20"
          x2="180"
          y1={206 + i * 12}
          y2={206 + i * 12}
        />
      ))}
    </>
  ),
];

export type PosterDef = { title: string; motif: number; palette: number };

export const POSTERS: PosterDef[] = [
  { title: "Orbital Kitchen", motif: 5, palette: 2 },
  { title: "Harbor Lights", motif: 10, palette: 1 },
  { title: "Static", motif: 6, palette: 0 },
  { title: "The General", motif: 3, palette: 3 },
  { title: "Safety Last", motif: 1, palette: 5 },
  { title: "Duck Soup", motif: 2, palette: 6 },
  { title: "Sherlock Jr.", motif: 7, palette: 4 },
  { title: "Low Tide", motif: 0, palette: 3 },
  { title: "Paper Moons", motif: 8, palette: 2 },
  { title: "The Long Quiet", motif: 4, palette: 1 },
  { title: "Night Ferry", motif: 2, palette: 5 },
  { title: "Glass Orchard", motif: 11, palette: 4 },
  { title: "Velvet Hour", motif: 9, palette: 0 },
  { title: "Tin Kingdom", motif: 1, palette: 6 },
  { title: "Second Sunrise", motif: 0, palette: 1 },
  { title: "Salt Road", motif: 6, palette: 3 },
  { title: "The Lamplighters", motif: 10, palette: 2 },
  { title: "Blue Meridian", motif: 5, palette: 5 },
  { title: "Midnight Annex", motif: 7, palette: 0 },
  { title: "Small Gods of Rain", motif: 9, palette: 4 },
];

export function Poster({
  def,
  uid,
  label = true,
}: {
  def: PosterDef;
  uid: string;
  label?: boolean;
}) {
  const p = PALETTES[def.palette % PALETTES.length];
  const gid = `g-${uid}`;
  const dark = def.palette !== 6;
  return (
    <svg
      aria-hidden="true"
      className="lp-poster"
      focusable="false"
      viewBox="0 0 200 300"
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={p.bg2} />
          <stop offset="1" stopColor={p.bg1} />
        </linearGradient>
      </defs>
      <rect fill={`url(#${gid})`} height="300" width="200" />
      {MOTIFS[def.motif % MOTIFS.length](p)}
      {label && (
        <>
          <rect
            fill={dark ? "#12081a" : "#2b1633"}
            height="52"
            opacity=".72"
            width="200"
            y="248"
          />
          <text
            fill="#f6ecf2"
            fontFamily="var(--lp-display)"
            fontSize="19"
            letterSpacing="1.5"
            textAnchor="middle"
            x="100"
            y="281"
          >
            {def.title.toUpperCase()}
          </text>
        </>
      )}
    </svg>
  );
}
