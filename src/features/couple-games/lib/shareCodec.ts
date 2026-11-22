import { z } from "zod";
import type { CoupleGameId } from "../registry";
import { appLink } from "../../../components/ShareButtons";

/**
 * Client-side share links for couple games.
 *
 * A token is `<format><base64url>` where format is `j` (plain UTF-8 JSON) or
 * `z` (deflate-raw compressed JSON, used when the browser supports it and it is
 * shorter). This is encoding, NOT encryption: anyone with the link can read it.
 */
export const SHARE_VERSION = 1;
/** Conservative limit: long links get truncated by some messaging apps. */
export const MAX_SHARE_TOKEN = 12000;
/** Upper bound on decompressed JSON, to stop decompression bombs. */
export const MAX_DECODED_BYTES = 256 * 1024;
export const MAX_IMPORT_FILE_BYTES = 512 * 1024;

export class ShareTooLargeError extends Error {
  constructor() {
    super(
      "This challenge is too big for a link. Download it as a file and send that instead.",
    );
    this.name = "ShareTooLargeError";
  }
}
export class InvalidShareError extends Error {
  constructor(message = "This challenge link is invalid, incomplete or from an unsupported version.") {
    super(message);
    this.name = "InvalidShareError";
  }
}

const envelope = (game: CoupleGameId, data: z.ZodType) =>
  z
    .object({ v: z.literal(SHARE_VERSION), g: z.literal(game), d: data })
    .strict();

export function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function fromBase64Url(text: string) {
  const raw = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const canCompress = () =>
  typeof CompressionStream === "function" &&
  typeof DecompressionStream === "function";

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, limit: number) {
  const writer = stream.writable.getWriter();
  void writer.write(bytes as unknown as BufferSource).then(() => writer.close()).catch(() => {});
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new InvalidShareError();
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export async function encodeShare<T>(
  game: CoupleGameId,
  schema: z.ZodType<T>,
  data: T,
): Promise<string> {
  const parsed = envelope(game, schema).parse({ v: SHARE_VERSION, g: game, d: data });
  const json = new TextEncoder().encode(JSON.stringify(parsed));
  let token = `j${toBase64Url(json)}`;
  if (canCompress()) {
    try {
      const packed = `z${toBase64Url(await pipe(json, new CompressionStream("deflate-raw"), MAX_DECODED_BYTES))}`;
      if (packed.length < token.length) token = packed;
    } catch {
      /* Fall back to plain JSON. */
    }
  }
  if (token.length > MAX_SHARE_TOKEN) throw new ShareTooLargeError();
  return token;
}

export async function decodeShare<T>(
  game: CoupleGameId,
  schema: z.ZodType<T>,
  token: string | undefined,
): Promise<T> {
  if (!token || token.length > MAX_SHARE_TOKEN || !/^[jz][A-Za-z0-9_-]+$/.test(token))
    throw new InvalidShareError();
  try {
    let bytes = fromBase64Url(token.slice(1));
    if (token[0] === "z") {
      if (!canCompress())
        throw new InvalidShareError("This browser can’t open compressed links. Try an up-to-date browser.");
      bytes = await pipe(bytes, new DecompressionStream("deflate-raw"), MAX_DECODED_BYTES);
    }
    if (bytes.length > MAX_DECODED_BYTES) throw new InvalidShareError();
    const json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return envelope(game, schema).parse(json).d as T;
  } catch (error) {
    if (error instanceof InvalidShareError) throw error;
    throw new InvalidShareError();
  }
}

export const challengeUrl = (game: CoupleGameId, token: string) =>
  appLink(`/couple-games/${game}/open/${token}`);

/* ---------- File export / import (for content too large for a link) ---------- */

const FILE_MARK = "heartpop-couple-game";

export function exportFileContent<T>(game: CoupleGameId, schema: z.ZodType<T>, data: T) {
  const parsed = envelope(game, schema).parse({ v: SHARE_VERSION, g: game, d: data });
  return JSON.stringify({ format: FILE_MARK, ...parsed });
}

export function parseImportedFile<T>(game: CoupleGameId, schema: z.ZodType<T>, text: string): T {
  if (text.length > MAX_IMPORT_FILE_BYTES) throw new InvalidShareError("That file is too large.");
  try {
    const raw = JSON.parse(text);
    if (!raw || typeof raw !== "object" || raw.format !== FILE_MARK) throw new Error();
    const { v, g, d } = raw as Record<string, unknown>;
    if (g !== game) throw new InvalidShareError("That file belongs to a different game.");
    return envelope(game, schema).parse({ v, g, d }).d as T;
  } catch (error) {
    if (error instanceof InvalidShareError) throw error;
    throw new InvalidShareError("We couldn’t read that file. It may be damaged or from another app.");
  }
}

export async function readFileText(file: File) {
  if (file.size > MAX_IMPORT_FILE_BYTES) throw new InvalidShareError("That file is too large.");
  return file.text();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string) {
  downloadBlob(new Blob([text], { type: "application/json" }), filename);
}

/* ---------- Shared field schemas ---------- */
export const nameField = z.string().trim().max(30);
export const shortText = (max: number) => z.string().trim().max(max);
