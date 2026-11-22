import { useId, type ReactNode } from "react";
import type { CoupleGameId } from "../registry";

/** Original, hand-drawn style SVG icons for each game (decorative). */
export function GameIcon({ id, size = 56 }: { id: CoupleGameId; size?: number }) {
  const gradient = `cg-grad-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      className="cg-icon"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8fb1" />
          <stop offset="1" stopColor="#b8a4ff" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${gradient})`} opacity="0.22" />
      <g fill="none" stroke="#7c3c5c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[id]}
      </g>
    </svg>
  );
}

const heart = "M32 48 C14 36 14 20 24 18 C29 17 32 21 32 24 C32 21 35 17 40 18 C50 20 50 36 32 48Z";

const ICONS: Record<CoupleGameId, ReactNode> = {
  "guess-my-feelings": (
    <>
      <circle cx="32" cy="32" r="17" />
      <circle cx="26" cy="29" r="1.8" fill="#7c3c5c" />
      <circle cx="38" cy="29" r="1.8" fill="#7c3c5c" />
      <path d="M25 38 C29 42 35 42 39 38" />
      <path d="M48 14 l2 4 l4 1 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -1z" fill="#ffd6ba" strokeWidth="2" />
    </>
  ),
  "love-memory-match": (
    <>
      <rect x="12" y="16" width="18" height="26" rx="4" transform="rotate(-8 21 29)" />
      <rect x="34" y="20" width="18" height="26" rx="4" transform="rotate(8 43 33)" fill="#ffe1ea" />
      <path d="M43 30 c-3 -3 -7 0 -4 4 l4 4 l4 -4 c3 -4 -1 -7 -4 -4z" fill="#ff6b9d" strokeWidth="1.5" />
    </>
  ),
  "you-vs-me": (
    <>
      <circle cx="20" cy="26" r="7" />
      <circle cx="44" cy="26" r="7" />
      <path d="M10 46 c2 -8 18 -8 20 0 M34 46 c2 -8 18 -8 20 0" />
      <path d="M33 12 l-4 8 h6 l-4 8" stroke="#e0a100" />
    </>
  ),
  "our-dream-date": (
    <>
      <path d="M40 14 a16 16 0 1 0 12 26 a13 13 0 0 1 -12 -26z" fill="#ffe9c7" />
      <path d="M18 18 l1.5 3 l3 1.5 l-3 1.5 l-1.5 3 l-1.5 -3 l-3 -1.5 l3 -1.5z" fill="#b8a4ff" strokeWidth="1.5" />
    </>
  ),
  "love-truth-or-dare": (
    <>
      <rect x="14" y="14" width="22" height="30" rx="4" transform="rotate(-10 25 29)" />
      <rect x="28" y="18" width="22" height="30" rx="4" transform="rotate(10 39 33)" fill="#ffe1ea" />
      <text x="35" y="38" fontSize="12" fontWeight="800" fill="#7c3c5c" stroke="none">?!</text>
    </>
  ),
  "fix-our-heart": (
    <>
      <path d={heart} />
      <path d="M32 24 l-3 7 l5 4 l-3 8" />
    </>
  ),
  "send-me-a-hug": (
    <>
      <path d="M24 44 C10 34 10 20 18 19 C22 18 24 21 24 23 C24 21 26 18 30 19 C34 20 35 27 32 33" fill="#ffe1ea" />
      <path d="M40 44 C54 34 54 20 46 19 C42 18 40 21 40 23 C40 21 38 18 34 19 C30 20 29 27 32 33" fill="#efe9ff" />
    </>
  ),
  "find-my-love": (
    <>
      <rect x="18" y="28" width="28" height="22" rx="5" />
      <path d="M24 28 v-6 a8 8 0 0 1 16 0 v6" />
      <path d="M32 44 c-3 -3 -6 -5 -3 -8 c1.5 -1.5 3 0 3 1 c0 -1 1.5 -2.5 3 -1 c3 3 0 5 -3 8z" fill="#ff6b9d" strokeWidth="1.5" />
    </>
  ),
};
