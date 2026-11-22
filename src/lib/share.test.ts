import { describe, expect, it } from "vitest";
import {
  decodePayload,
  encodePayload,
  randomIndex,
  scoreQuiz,
  type Payload,
} from "./share";
const sample: Payload = {
  v: 1,
  kind: "envelope",
  to: "પ્રિયા 💕",
  from: "आदित्य",
  category: "You miss me",
  tone: "Cute",
  theme: "pink",
  language: "gu",
  message: "તમે મારા માટે ખાસ છો. ❤️",
};
describe("portable surprise links", () => {
  it("round trips Unicode without local storage", () =>
    expect(decodePayload(encodePayload(sample))).toEqual(sample));
  it.each(["", "%%%%", "a".repeat(7501), "abcd"])(
    "rejects malformed input",
    (token) => expect(() => decodePayload(token)).toThrow(),
  );
  it("rejects oversized content and unknown fields", () => {
    expect(() =>
      encodePayload({ ...sample, message: "a".repeat(701) }),
    ).toThrow();
    expect(() =>
      encodePayload({ ...sample, v: 2 } as unknown as Payload),
    ).toThrow();
  });
  it("renders markup as data", () =>
    expect(
      decodePayload(
        encodePayload({ ...sample, message: "<script>alert(1)</script>" }),
      ).message,
    ).toBe("<script>alert(1)</script>"));
  it("rejects quiz without questions", () =>
    expect(() => encodePayload({ ...sample, kind: "quiz" })).toThrow());
});
it("scores answers accurately", () => {
  const q = { prompt: "Favorite?", options: ["A", "B", "C", "D"], answer: 2 };
  expect(scoreQuiz([q, q], [2, 1])).toBe(1);
});
it("random selection is in range and covers all choices", () => {
  const picks = Array.from({ length: 200 }, () => randomIndex(4));
  expect(picks.every((n) => n >= 0 && n < 4)).toBe(true);
  expect(new Set(picks).size).toBe(4);
  expect(() => randomIndex(0)).toThrow();
});
