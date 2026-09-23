import { useId } from "react";
import type { ArtKey, Tone } from "../data/types";

/**
 * Editorial placeholder illustrations: a faceless portrait whose hair shape
 * matches the style. They stand in until real photography is supplied
 * (drop files into /public/images, see the Photo component).
 */
const TONES: Record<Tone, { bg: [string, string]; cloth: string; skin: string; hair: string; ring: string }> = {
  sand: { bg: ["#f1e9dd", "#dccbb4"], cloth: "#faf7f2", skin: "#8b5a3c", hair: "#231a15", ring: "#b99563" },
  rose: { bg: ["#f5e6e0", "#dfbcb0"], cloth: "#fbf6f2", skin: "#7a4b33", hair: "#221814", ring: "#a8756a" },
  gold: { bg: ["#f0e4cf", "#d3b88b"], cloth: "#1c1816", skin: "#9a6645", hair: "#1f1612", ring: "#8f6f43" },
  cocoa: { bg: ["#54433a", "#2a211c"], cloth: "#b99563", skin: "#8b5a3c", hair: "#110c0a", ring: "#b99563" },
  ivory: { bg: ["#fbf8f3", "#e8ddcd"], cloth: "#d9b5aa", skin: "#6e452f", hair: "#1d1512", ring: "#b99563" },
  blush: { bg: ["#f7ebe6", "#e6cabf"], cloth: "#b99563", skin: "#a0694a", hair: "#241915", ring: "#a8756a" },
};

// Head: centre (200, 222), face rx 56, ry 72
const CAP = "M140 222 C136 150 170 124 200 124 C232 124 266 150 260 222 C252 184 232 168 200 168 C168 168 148 184 140 222 Z";

function strands(side: -1 | 1, count: number, width: number, dash: string, color: string, from = 150, to = 470) {
  return Array.from({ length: count }, (_, i) => {
    const t = i / Math.max(1, count - 1);
    const x0 = 200 + side * (38 + t * 26);
    const y0 = from + t * 70;
    const x1 = 200 + side * (40 + t * 62);
    const d = `M${x0} ${y0} C${x0 + side * 14} ${y0 + 110} ${x1 - side * 6} ${to - 150} ${x1} ${to - (i % 3) * 14}`;
    return (
      <g key={`${side}-${i}`}>
        <path d={d} stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" fill="none" />
        <path d={d} stroke="#fff" strokeOpacity="0.16" strokeWidth={width * 0.5} strokeDasharray={`1.2 ${Math.max(3, width * 0.55)}`} fill="none" />
      </g>
    );
  });
}

function BackHair({ art, hair }: { art: ArtKey; hair: string }) {
  switch (art) {
    case "braids":
      return (
        <g>
          <ellipse cx="200" cy="210" rx="74" ry="86" fill={hair} />
          {strands(-1, 9, 9, "7 2.4", hair)}
          {strands(1, 9, 9, "7 2.4", hair)}
        </g>
      );
    case "locs":
      return (
        <g>
          <ellipse cx="200" cy="208" rx="76" ry="86" fill={hair} />
          {strands(-1, 6, 14, "15 3", hair, 150, 440)}
          {strands(1, 6, 14, "15 3", hair, 150, 440)}
        </g>
      );
    case "twists":
      return (
        <g>
          <ellipse cx="200" cy="205" rx="84" ry="88" fill={hair} />
          {strands(-1, 8, 11, "5 2", hair, 140, 380)}
          {strands(1, 8, 11, "5 2", hair, 140, 380)}
        </g>
      );
    case "straight":
      return (
        <g fill={hair}>
          <ellipse cx="200" cy="210" rx="70" ry="84" />
          <path d="M132 190 C120 280 124 360 112 424 Q140 438 170 414 C160 344 150 280 148 228 Z" />
          <path d="M268 190 C280 280 276 360 288 424 Q260 438 230 414 C240 344 250 280 252 228 Z" />
        </g>
      );
    case "wig":
      return (
        <g fill={hair}>
          <ellipse cx="200" cy="208" rx="80" ry="90" />
          <path d="M134 180 C96 240 132 292 104 344 C82 392 120 424 98 466 L176 446 C150 382 164 318 150 246 Z" />
          <path d="M266 180 C304 240 268 292 296 344 C318 392 280 424 302 466 L224 446 C250 382 236 318 250 246 Z" />
        </g>
      );
    case "curls": {
      const puffs = Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return <circle key={i} cx={200 + Math.cos(a) * 104} cy={206 + Math.sin(a) * 96} r={28 + (i % 3) * 4} />;
      });
      return (
        <g fill={hair}>
          <ellipse cx="200" cy="206" rx="106" ry="98" />
          {puffs}
        </g>
      );
    }
    case "bun":
      return (
        <g fill={hair}>
          <ellipse cx="200" cy="214" rx="64" ry="80" />
          <circle cx="200" cy="112" r="36" />
        </g>
      );
    case "cornrows":
      return (
        <g>
          <ellipse cx="200" cy="214" rx="64" ry="80" fill={hair} />
          <path d="M226 260 C250 330 236 400 246 460" stroke={hair} strokeWidth="11" strokeDasharray="6 2" strokeLinecap="round" fill="none" />
          <path d="M174 260 C150 330 164 400 154 460" stroke={hair} strokeWidth="11" strokeDasharray="6 2" strokeLinecap="round" fill="none" />
        </g>
      );
    case "short":
      return <ellipse cx="200" cy="214" rx="62" ry="80" fill={hair} />;
  }
}

function CapDetail({ art, hair, light }: { art: ArtKey; hair: string; light: string }) {
  if (art === "cornrows" || art === "short") {
    const rows = art === "short" ? [] : [-36, -18, 0, 18, 36];
    return (
      <g>
        <path d={art === "short" ? "M144 212 C142 156 172 136 200 136 C230 136 260 156 256 212 C246 182 228 172 200 172 C172 172 152 182 144 212 Z" : CAP} fill={hair} />
        {rows.map((dx) => (
          <path
            key={dx}
            d={`M${200 + dx * 1.3} 172 C${200 + dx * 1.1} 150 ${200 + dx * 0.5} 132 ${200 + dx * 0.2} 126`}
            stroke={light}
            strokeOpacity="0.28"
            strokeWidth="1.4"
            fill="none"
          />
        ))}
      </g>
    );
  }
  return (
    <g>
      <path d={CAP} fill={hair} />
      {art === "straight" || art === "wig" ? (
        <path d="M200 126 C196 146 190 160 178 170" stroke={light} strokeOpacity="0.22" strokeWidth="1.4" fill="none" />
      ) : null}
    </g>
  );
}

export default function HairArt({ art, tone, className }: { art: ArtKey; tone: Tone; className?: string }) {
  const t = TONES[tone];
  const id = useId().replace(/:/g, "");
  const earrings = art !== "short";
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={t.bg[0]} />
          <stop offset="1" stopColor={t.bg[1]} />
        </linearGradient>
        <radialGradient id={`glow${id}`} cx="0.35" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`skin${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.skin} />
          <stop offset="1" stopColor={t.skin} stopOpacity="0.82" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#bg${id})`} />
      <circle cx="200" cy="236" r="164" fill="none" stroke={t.ring} strokeOpacity="0.35" strokeWidth="1" />
      <circle cx="200" cy="236" r="178" fill="none" stroke={t.ring} strokeOpacity="0.16" strokeWidth="1" />
      <BackHair art={art} hair={t.hair} />
      <path d="M70 500 C78 412 140 364 200 360 C260 364 322 412 330 500 Z" fill={t.cloth} />
      <path d="M178 272 L175 352 Q200 366 225 352 L222 272 Z" fill={`url(#skin${id})`} />
      <ellipse cx="200" cy="222" rx="56" ry="72" fill={`url(#skin${id})`} />
      <CapDetail art={art} hair={t.hair} light={t.bg[0]} />
      {art === "braids" || art === "locs" ? (
        <>
          <path d="M156 196 C150 250 146 300 142 360" stroke={t.hair} strokeWidth="9" strokeDasharray="7 2.4" strokeLinecap="round" fill="none" />
          <path d="M244 196 C250 250 254 300 258 360" stroke={t.hair} strokeWidth="9" strokeDasharray="7 2.4" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {earrings ? (
        <>
          <circle cx="145" cy="248" r="4.5" fill="#d8b77e" />
          <circle cx="255" cy="248" r="4.5" fill="#d8b77e" />
        </>
      ) : null}
      <rect width="400" height="500" fill={`url(#glow${id})`} />
    </svg>
  );
}
