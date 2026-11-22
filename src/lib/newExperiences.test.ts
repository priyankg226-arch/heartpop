import { describe, expect, it } from "vitest";
import {
  bingoLines,
  decodePayload,
  encodePayload,
  unlockTime,
  type Payload,
} from "./share";
import { bingoDefaults, starDefaults } from "../i18n/newExperiences";
import { languages, type Language } from "../i18n";

const base = {
  v: 1 as const,
  to: "પ્રિયા",
  from: "Jay",
  category: "Love You",
  tone: "Cute",
  theme: "pink" as const,
  language: "gu" as const,
  message: "તું ખાસ છે.",
};

describe("new experience links", () => {
  it("round trips stars, bingo, hearts and future payloads", () => {
    const payloads: Payload[] = [
      { ...base, kind: "stars", stars: starDefaults.gu },
      { ...base, kind: "bingo", bingo: bingoDefaults.gu },
      { ...base, kind: "hearts" },
      { ...base, kind: "future", unlockAt: "2030-02-14" },
    ];
    for (const p of payloads)
      expect(decodePayload(encodePayload(p))).toEqual(p);
  });
  it("requires the data each experience needs", () => {
    expect(() => encodePayload({ ...base, kind: "stars" })).toThrow();
    expect(() => encodePayload({ ...base, kind: "bingo" })).toThrow();
    expect(() => encodePayload({ ...base, kind: "future" })).toThrow();
    expect(() =>
      encodePayload({ ...base, kind: "stars", stars: ["a", "b"] }),
    ).toThrow();
    expect(() =>
      encodePayload({ ...base, kind: "bingo", bingo: ["a", "b", "c"] }),
    ).toThrow();
    expect(() =>
      encodePayload({ ...base, kind: "future", unlockAt: "14/02/2030" }),
    ).toThrow();
  });
  it("ships complete defaults in every language", () => {
    for (const lang of Object.keys(languages) as Language[]) {
      expect(starDefaults[lang]).toHaveLength(5);
      expect(bingoDefaults[lang]).toHaveLength(9);
    }
  });
});

describe("bingo lines", () => {
  const board = (marked: number[]) =>
    Array.from({ length: 9 }, (_, i) => marked.includes(i));
  it("finds rows, columns and diagonals", () => {
    expect(bingoLines(board([0, 1, 2]))).toEqual([[0, 1, 2]]);
    expect(bingoLines(board([2, 5, 8]))).toEqual([[2, 5, 8]]);
    expect(bingoLines(board([2, 4, 6]))).toEqual([[2, 4, 6]]);
    expect(bingoLines(board([0, 1, 4, 8]))).toEqual([[0, 4, 8]]);
  });
  it("needs three in a row", () => {
    expect(bingoLines(board([0, 1, 5, 6]))).toEqual([]);
  });
});

it("unlocks at local midnight of the chosen date", () => {
  const t = new Date(unlockTime("2030-02-14"));
  expect([t.getFullYear(), t.getMonth(), t.getDate(), t.getHours()]).toEqual([
    2030, 1, 14, 0,
  ]);
});
