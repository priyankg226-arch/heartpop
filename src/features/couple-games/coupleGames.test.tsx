import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { COUPLE_GAMES, COUPLE_GAME_IDS, filterGames, featuredGame } from "./registry";
import {
  answerMatches,
  buildDeck,
  clueScore,
  compareYouVsMe,
  feelingScore,
  memoryScore,
  mergeDreamDate,
  normalizeAnswer,
  normalizePerspective,
  shuffle,
  slotAt,
  snapsInto,
  splitAnswers,
} from "./lib/gameLogic";
import { decodeShare, encodeShare, exportFileContent, parseImportedFile, InvalidShareError, ShareTooLargeError } from "./lib/shareCodec";
import { clearAll, getItem, getValidated, setItem } from "./lib/storage";
import { z } from "zod";
import { hugShareSchema } from "./games/SendMeAHug";
import { huntShareSchema } from "./games/FindMyLove";
import { yvmShareSchema } from "./games/YouVsMe";
import { buildPool } from "./games/LoveTruthOrDare";
import CoupleGameRoute from "./CoupleGameRoute";
import CoupleGamesHub from "./CoupleGamesHub";

describe("registry", () => {
  it("has a unique, routable definition for every game id", () => {
    expect(COUPLE_GAMES.map((g) => g.id)).toEqual([...COUPLE_GAME_IDS]);
    for (const g of COUPLE_GAMES) {
      expect(g.route).toBe(`/couple-games/${g.id}`);
      expect(g.supportedModes.length).toBeGreaterThan(0);
      expect(g.howToPlay.length).toBeGreaterThan(0);
    }
  });
  it("filters by category and search text", () => {
    expect(filterGames(COUPLE_GAMES, "puzzles", "").every((g) => g.category === "puzzles")).toBe(true);
    expect(filterGames(COUPLE_GAMES, "all", "hug").map((g) => g.id)).toContain("send-me-a-hug");
    expect(filterGames(COUPLE_GAMES, "all", "zzzz")).toEqual([]);
    expect(COUPLE_GAMES).toContain(featuredGame(new Date(2026, 1, 14)));
  });
});

describe("game logic", () => {
  it("shuffles without losing items", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    expect(shuffle(items).sort((a, b) => a - b)).toEqual(items);
  });
  it("normalizes answers (case, whitespace, punctuation, Unicode)", () => {
    expect(normalizeAnswer("  Pizza!! ")).toBe("pizza");
    expect(answerMatches("ＰＩＺＺＡ", ["pizza"])).toBe(true);
    expect(answerMatches("café", ["café"])).toBe(true);
    expect(answerMatches("नमस्ते", ["नमस्ते"])).toBe(true);
    expect(answerMatches("", ["x"])).toBe(false);
    expect(splitAnswers("Pizza, margherita\npizza / Pasta")).toEqual(["Pizza", "margherita", "pizza", "Pasta"]);
  });
  it("scores feelings exact, close and different", () => {
    expect(feelingScore("Happy", "happy").points).toBe(100);
    expect(feelingScore("Missing you", "Lonely").points).toBe(50);
    expect(feelingScore("Lonely", "Missing you").points).toBe(50);
    expect(feelingScore("Happy", "Tired").points).toBe(0);
  });
  it("builds paired decks and scores memory without negatives", () => {
    const deck = buildDeck(8, "abcdefghijkl".split(""));
    expect(deck).toHaveLength(16);
    const counts = new Map<number, number>();
    deck.forEach((c) => counts.set(c.pair, (counts.get(c.pair) ?? 0) + 1));
    expect([...counts.values()].every((n) => n === 2)).toBe(true);
    expect(memoryScore(4, 4)).toBe(400);
    expect(memoryScore(4, 10)).toBe(340);
    expect(memoryScore(1, 500)).toBe(0);
  });
  it("normalizes You vs Me perspectives before comparing", () => {
    expect(normalizePerspective("me", "A")).toBe("A");
    expect(normalizePerspective("me", "B")).toBe("B");
    expect(normalizePerspective("partner", "B")).toBe("A");
    // A says "me", B says "my partner": both mean A → match.
    const r = compareYouVsMe(["me", "me", "both"], ["partner", "me", "both"]);
    expect(r.rows.map((x) => x.match)).toEqual([true, false, true]);
    expect(r.agreement).toBe(67);
  });
  it("merges dream dates deterministically", () => {
    const m = mergeDreamDate(["x", "y", "z"], { x: "Beach", y: "Sunrise", z: "" }, { x: "Beach", y: "Late night", z: "Sushi" });
    expect(m[0]).toMatchObject({ shared: true, chosen: "Beach" });
    expect(m[1]).toMatchObject({ shared: false, chosen: "Late night", chosenBy: "B" });
    expect(m[2]).toMatchObject({ chosen: "Sushi", chosenBy: "B" });
  });
  it("scores clues and puzzle placement", () => {
    expect(clueScore(true, 1, 2)).toBe(55);
    expect(clueScore(false, 0, 0)).toBe(0);
    expect(clueScore(true, 4, 10)).toBe(0);
    expect(slotAt(10, 10, 3, 600)).toBe(0);
    expect(slotAt(599, 599, 3, 600)).toBe(8);
    expect(slotAt(-1, 5, 3, 600)).toBe(-1);
    expect(snapsInto(4, 300, 300, 3, 600)).toBe(true);
    expect(snapsInto(0, 300, 300, 3, 600)).toBe(false);
  });
  it("builds truth-or-dare pools only from chosen categories", () => {
    const pool = buildPool(["cute"], "truth", { truth: ["Custom?"], dare: [] });
    expect(pool.every((c) => c.id.startsWith("cute:truth"))).toBe(true);
    expect(buildPool(["custom"], "truth", { truth: ["Custom?"], dare: [] })).toHaveLength(1);
    expect(new Set(buildPool(["cute", "funny"], "dare", { truth: [], dare: [] }).map((c) => c.id)).size).toBe(16);
  });
});

describe("share codec", () => {
  const hug = { from: "Jay", to: "Mira ♡", theme: "warm", message: "बड़ी सी झप्पी 🤗", colors: [0, 1] as [number, number] };
  it("round-trips Unicode payloads", async () => {
    const token = await encodeShare("send-me-a-hug", hugShareSchema, hug);
    expect(token).toMatch(/^[jz][A-Za-z0-9_-]+$/);
    expect(await decodeShare("send-me-a-hug", hugShareSchema, token)).toEqual(hug);
  });
  it("rejects malformed, foreign and oversized tokens", async () => {
    await expect(decodeShare("send-me-a-hug", hugShareSchema, "jnot*valid")).rejects.toBeInstanceOf(InvalidShareError);
    await expect(decodeShare("send-me-a-hug", hugShareSchema, "jeyJ4IjoxfQ")).rejects.toBeInstanceOf(InvalidShareError);
    const token = await encodeShare("send-me-a-hug", hugShareSchema, hug);
    await expect(decodeShare("find-my-love", huntShareSchema, token)).rejects.toBeInstanceOf(InvalidShareError);
    await expect(decodeShare("send-me-a-hug", hugShareSchema, `j${"A".repeat(13000)}`)).rejects.toBeInstanceOf(InvalidShareError);
    const big = z.object({ s: z.string() });
    const noise = Array.from({ length: 20000 }, () => String.fromCharCode(33 + Math.floor(Math.random() * 90))).join("");
    await expect(encodeShare("send-me-a-hug", big, { s: noise })).rejects.toBeInstanceOf(ShareTooLargeError);
  });
  it("enforces schema limits", async () => {
    await expect(encodeShare("send-me-a-hug", hugShareSchema, { ...hug, message: "x".repeat(201) })).rejects.toThrow();
    const yvm = { a: "", b: "", category: "fun" as const, q: [0, 1], answers: ["me" as const] };
    expect(yvmShareSchema.safeParse(yvm).success).toBe(false);
  });
  it("exports and imports files with validation", () => {
    const text = exportFileContent("send-me-a-hug", hugShareSchema, hug);
    expect(parseImportedFile("send-me-a-hug", hugShareSchema, text)).toEqual(hug);
    expect(() => parseImportedFile("find-my-love", huntShareSchema, text)).toThrow(InvalidShareError);
    expect(() => parseImportedFile("send-me-a-hug", hugShareSchema, "{oops")).toThrow(InvalidShareError);
  });
});

describe("storage", () => {
  it("stores, validates and clears records", async () => {
    await setItem("favorites", ["you-vs-me"]);
    expect(await getItem("favorites")).toEqual(["you-vs-me"]);
    await setItem("broken", { nope: true });
    expect(await getValidated("broken", z.array(z.string()))).toBeUndefined();
    expect(await getItem("broken")).toBeUndefined();
    await clearAll();
    expect(await getItem("favorites")).toBeUndefined();
  });
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/couple-games" element={<CoupleGamesHub />} />
        <Route path="/couple-games/:gameId/*" element={<CoupleGameRoute />} />
      </Routes>
    </MemoryRouter>,
  );

describe("components", () => {
  it("hub lists every game and filters by search", () => {
    renderAt("/couple-games");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Two Hearts");
    for (const g of COUPLE_GAMES) expect(screen.getAllByRole("link", { name: `Play ${g.title}` }).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "virtual hug" } });
    expect(screen.getByText("1 games shown")).toBeInTheDocument();
  });

  it("You vs Me hides A's answers from B and reveals a normalized comparison", async () => {
    renderAt("/couple-games/you-vs-me");
    fireEvent.change(await screen.findByLabelText("Partner A"), { target: { value: "Mira" } });
    fireEvent.change(screen.getByLabelText("Partner B"), { target: { value: "Jay" } });
    fireEvent.click(screen.getByRole("button", { name: /Let’s play/ }));
    for (let i = 0; i < 5; i++) fireEvent.click(await screen.findByRole("button", { name: /🙋 Me/ }));
    expect(await screen.findByRole("heading", { name: "Pass the device to Jay" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "I’m ready" }));
    expect(screen.queryByText(/Mira said/)).not.toBeInTheDocument();
    for (let i = 0; i < 5; i++) fireEvent.click(await screen.findByRole("button", { name: /👉 My partner/ }));
    expect(await screen.findByText("100%")).toBeInTheDocument();
    expect(screen.getAllByText(/Mira said/)).toHaveLength(5);
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).not.toBeInTheDocument();
  });

  it("Memory Match is keyboard-operable and announces card states", async () => {
    renderAt("/couple-games/love-memory-match");
    fireEvent.click(await screen.findByRole("button", { name: /Let’s play/ }));
    const cards = await screen.findAllByRole("button", { name: /face down/ });
    expect(cards).toHaveLength(8);
    fireEvent.click(cards[0]);
    expect(screen.getByRole("button", { name: /Card 1, (?!face down)/ })).toBeInTheDocument();
  });

  it("shows a friendly error for broken challenge links", async () => {
    renderAt("/couple-games/send-me-a-hug/open/jgarbage");
    expect(await screen.findByRole("heading", { name: "We couldn’t open this challenge." })).toBeInTheDocument();
  });
});
