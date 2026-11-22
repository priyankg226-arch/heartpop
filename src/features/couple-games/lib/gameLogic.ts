import { randomIndex } from "../../../lib/share";

/* ---------- Randomness ---------- */
/** Unbiased Fisher–Yates shuffle using crypto-backed indices. */
export function shuffle<T>(items: readonly T[], pick: (n: number) => number = randomIndex): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ---------- Text answers ---------- */
/** Trim, Unicode-normalise (NFKC), lowercase, drop punctuation and collapse spaces. */
export function normalizeAnswer(text: string) {
  return text
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function answerMatches(input: string, accepted: readonly string[]) {
  const guess = normalizeAnswer(input);
  if (!guess) return false;
  return accepted.some((a) => normalizeAnswer(a) === guess);
}
/** Splits a creator's "accepted answers" field on commas, slashes or new lines. */
export function splitAnswers(text: string, max = 6) {
  return [...new Set(text.split(/[,\n/|]/).map((a) => a.trim()).filter(Boolean))].slice(0, max);
}

/* ---------- Guess My Feelings ---------- */
export const FEELINGS = [
  "Happy",
  "Excited",
  "Missing you",
  "Nervous",
  "Tired",
  "Grateful",
  "Loved",
  "Frustrated",
  "Lonely",
  "Playful",
  "Hopeful",
  "Overwhelmed",
] as const;
/** Explicit, symmetric "close enough" pairs. Anything else is a different guess. */
const CLOSE_FEELINGS: [string, string][] = [
  ["Happy", "Excited"],
  ["Happy", "Playful"],
  ["Happy", "Grateful"],
  ["Excited", "Playful"],
  ["Excited", "Hopeful"],
  ["Grateful", "Loved"],
  ["Loved", "Happy"],
  ["Missing you", "Lonely"],
  ["Nervous", "Overwhelmed"],
  ["Tired", "Overwhelmed"],
  ["Frustrated", "Overwhelmed"],
  ["Hopeful", "Grateful"],
];
export function feelingsAreClose(a: string, b: string) {
  return CLOSE_FEELINGS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}
export function feelingScore(actual: string, guess: string) {
  if (answerMatches(guess, [actual])) return { points: 100, verdict: "exact" as const };
  if (feelingsAreClose(actual, guess)) return { points: 50, verdict: "close" as const };
  return { points: 0, verdict: "different" as const };
}

/* ---------- Love Memory Match ---------- */
export interface MemoryCard {
  id: number;
  pair: number;
  symbol: string;
}
export const MEMORY_PAIRS = { easy: 4, medium: 8, hard: 12 } as const;
export type MemoryDifficulty = keyof typeof MEMORY_PAIRS;
export function buildDeck(pairs: number, symbols: readonly string[], pick?: (n: number) => number): MemoryCard[] {
  if (pairs < 1 || pairs > symbols.length) throw new Error("Not enough symbols for this deck");
  const chosen = shuffle(symbols, pick).slice(0, pairs);
  return shuffle(
    chosen.flatMap((symbol, pair) => [
      { id: pair * 2, pair, symbol },
      { id: pair * 2 + 1, pair, symbol },
    ]),
    pick,
  );
}
/** Score = 100 per pair − 10 per extra attempt beyond the minimum, never below 0. */
export function memoryScore(matches: number, attempts: number) {
  const extra = Math.max(0, attempts - matches);
  return Math.max(0, matches * 100 - extra * 10);
}

/* ---------- You vs Me ---------- */
export type YvmAnswer = "me" | "partner" | "both" | "neither";
export type YvmNormalized = "A" | "B" | "both" | "neither";
/** Converts a first-person answer into who it actually refers to. */
export function normalizePerspective(answer: YvmAnswer, player: "A" | "B"): YvmNormalized {
  if (answer === "me") return player;
  if (answer === "partner") return player === "A" ? "B" : "A";
  return answer;
}
export function compareYouVsMe(a: YvmAnswer[], b: YvmAnswer[]) {
  const rows = a.map((answer, i) => {
    const left = normalizePerspective(answer, "A");
    const right = normalizePerspective(b[i], "B");
    return { a: left, b: right, match: left === right };
  });
  const matches = rows.filter((r) => r.match).length;
  return {
    rows,
    matches,
    agreement: rows.length ? Math.round((matches / rows.length) * 100) : 0,
  };
}
export function youVsMeTitle(agreement: number) {
  if (agreement >= 90) return "Basically the same brain";
  if (agreement >= 70) return "Totally in sync";
  if (agreement >= 50) return "Sweetly on the same page";
  if (agreement >= 30) return "Lovingly different";
  return "Opposites attract!";
}

/* ---------- Our Dream Date ---------- */
export interface DateMerge {
  step: string;
  a: string;
  b: string;
  shared: boolean;
  chosen: string;
  chosenBy: "both" | "A" | "B";
}
/**
 * Deterministic combination: matching picks are kept; on differences the
 * partners take turns (A decides even-numbered steps, B odd-numbered ones).
 */
export function mergeDreamDate(steps: readonly string[], a: Record<string, string>, b: Record<string, string>): DateMerge[] {
  return steps.map((step, i) => {
    const left = a[step] ?? "";
    const right = b[step] ?? "";
    if (left && left === right) return { step, a: left, b: right, shared: true, chosen: left, chosenBy: "both" };
    if (!left || !right)
      return { step, a: left, b: right, shared: false, chosen: left || right, chosenBy: left ? "A" : right ? "B" : "both" };
    const turn = i % 2 === 0 ? "A" : "B";
    return { step, a: left, b: right, shared: false, chosen: turn === "A" ? left : right, chosenBy: turn };
  });
}

/* ---------- Find My Love ---------- */
/** 100 per solved clue − 25 per hint − 10 per wrong attempt (min 0). Revealed clues score 0. */
export function clueScore(solved: boolean, hintsUsed: number, wrongAttempts: number) {
  if (!solved) return 0;
  return Math.max(0, 100 - hintsUsed * 25 - wrongAttempts * 10);
}

/* ---------- Fix Our Heart ---------- */
export const PUZZLE_SIZES = { easy: 2, medium: 3, hard: 4 } as const;
export type PuzzleDifficulty = keyof typeof PUZZLE_SIZES;
/** Returns the grid slot under a point in board coordinates, or -1 outside the board. */
export function slotAt(x: number, y: number, grid: number, boardSize: number) {
  if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) return -1;
  const cell = boardSize / grid;
  return Math.floor(y / cell) * grid + Math.floor(x / cell);
}
/** A piece snaps only into its own slot, and only when dropped near its centre. */
export function snapsInto(piece: number, x: number, y: number, grid: number, boardSize: number, tolerance = 0.45) {
  const cell = boardSize / grid;
  const cx = (piece % grid) * cell + cell / 2;
  const cy = Math.floor(piece / grid) * cell + cell / 2;
  return Math.hypot(x - cx, y - cy) <= cell * tolerance;
}
export function puzzleAchievement(moves: number, pieces: number, hints: number) {
  if (moves === pieces && hints === 0) return "Flawless heart-mender";
  if (moves <= pieces * 1.5) return "Gentle hands";
  if (hints > 0) return "Teamwork makes the heart work";
  return "Love always finds a way";
}
