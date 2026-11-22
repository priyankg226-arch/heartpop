import { z } from "zod";
export const questionSchema = z
  .object({
    prompt: z.string().trim().min(3).max(120),
    options: z.array(z.string().trim().min(1).max(60)).length(4),
    answer: z.number().int().min(0).max(3),
  })
  .strict();
export const payloadSchema = z
  .object({
    v: z.literal(1),
    kind: z.enum([
      "envelope",
      "scratch",
      "message",
      "quiz",
      "stars",
      "hearts",
      "future",
      "bingo",
    ]),
    to: z.string().trim().min(1).max(40),
    from: z.string().trim().max(40),
    category: z.string().max(60),
    tone: z.string().max(20),
    theme: z.enum(["pink", "lavender", "peach", "gold", "mint"]),
    language: z.enum(["en", "hi", "gu", "hinglish", "roman-gu"]),
    message: z.string().trim().min(1).max(700),
    questions: z.array(questionSchema).min(5).max(10).optional(),
    stars: z.array(z.string().trim().min(1).max(120)).min(3).max(9).optional(),
    bingo: z.array(z.string().trim().min(1).max(60)).length(9).optional(),
    unlockAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.kind === "quiz" && !data.questions)
      ctx.addIssue({ code: "custom", message: "Quiz questions are missing." });
    if (data.kind === "stars" && !data.stars)
      ctx.addIssue({ code: "custom", message: "Star messages are missing." });
    if (data.kind === "bingo" && !data.bingo)
      ctx.addIssue({ code: "custom", message: "Bingo squares are missing." });
    if (data.kind === "future" && !data.unlockAt)
      ctx.addIssue({ code: "custom", message: "Unlock date is missing." });
  });
export const experienceKinds = payloadSchema.shape.kind.options;
/** Local midnight of a YYYY-MM-DD date. */
export function unlockTime(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
/** Winning bingo lines (indexes into a 3×3 board) for the marked squares. */
export function bingoLines(marked: boolean[]) {
  return LINES.filter((line) => line.every((i) => marked[i]));
}
export type Payload = z.infer<typeof payloadSchema>;
export type Question = z.infer<typeof questionSchema>;
export const MAX_TOKEN = 7500;
export function encodePayload(input: Payload) {
  const data = payloadSchema.parse(input);
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const token = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  if (token.length > MAX_TOKEN)
    throw new Error(
      "This surprise is too long to share. Please shorten the message or quiz answers.",
    );
  return token;
}
export function decodePayload(token: string): Payload {
  if (!token || token.length > MAX_TOKEN || !/^[A-Za-z0-9_-]+$/.test(token))
    throw new Error(
      "This surprise link is invalid or too long. Ask the sender for a new link.",
    );
  try {
    const raw = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
    return payloadSchema.parse(
      JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(
          Uint8Array.from(raw, (c) => c.charCodeAt(0)),
        ),
      ),
    );
  } catch {
    throw new Error(
      "We couldn’t open this surprise. The link may be incomplete or from an unsupported version.",
    );
  }
}
export function shareUrl(payload: Payload) {
  return `${window.location.href.split("#")[0]}#/surprise/${encodePayload(payload)}`;
}
export function randomIndex(length: number) {
  if (!Number.isInteger(length) || length < 1 || length > 1000)
    throw new Error("Invalid selection size");
  const range = 4294967296;
  const limit = range - (range % length);
  const data = new Uint32Array(1);
  do {
    crypto.getRandomValues(data);
  } while (data[0] >= limit);
  return data[0] % length;
}
export function scoreQuiz(questions: Question[], answers: number[]) {
  return questions.reduce(
    (total, q, i) => total + Number(q.answer === answers[i]),
    0,
  );
}
