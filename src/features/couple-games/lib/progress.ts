import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { COUPLE_GAME_IDS, type CoupleGameId, type PlayMode } from "../registry";
import { getValidated, removeItem, setItem, useStoredValue } from "./storage";

const gameIdSchema = z.enum(COUPLE_GAME_IDS);

/* ---------- Favorites & recently played ---------- */
export const favoritesSchema = z.array(gameIdSchema).max(COUPLE_GAME_IDS.length);
export const recentSchema = z
  .array(z.object({ id: gameIdSchema, at: z.number() }))
  .max(COUPLE_GAME_IDS.length);
const EMPTY: never[] = [];

export function useFavorites() {
  const [favorites, setFavorites, ready] = useStoredValue("favorites", favoritesSchema, EMPTY as CoupleGameId[]);
  const toggle = (id: CoupleGameId) =>
    setFavorites(favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]);
  return { favorites, toggle, ready };
}

export function useRecent() {
  const [recent, , ready] = useStoredValue("recent", recentSchema, EMPTY as z.infer<typeof recentSchema>);
  return { recent, ready };
}

export async function markPlayed(id: CoupleGameId, now = Date.now()) {
  const recent = (await getValidated("recent", recentSchema)) ?? [];
  const next = [{ id, at: now }, ...recent.filter((r) => r.id !== id)].slice(0, COUPLE_GAME_IDS.length);
  await setItem("recent", next);
}

/* ---------- Resumable sessions ---------- */
export const SESSION_SCHEMA_VERSION = 1;
export const playersSchema = z.object({ a: z.string().max(30), b: z.string().max(30) });
export type Players = z.infer<typeof playersSchema>;

export interface GameSession<S> {
  id: string;
  gameId: CoupleGameId;
  schemaVersion: typeof SESSION_SCHEMA_VERSION;
  mode: PlayMode;
  players: Players;
  createdAt: number;
  updatedAt: number;
  phase: string;
  completed: boolean;
  state: S;
}

export function sessionSchema<S>(gameId: CoupleGameId, state: z.ZodType<S>) {
  return z.object({
    id: z.string().max(64),
    gameId: z.literal(gameId),
    schemaVersion: z.literal(SESSION_SCHEMA_VERSION),
    mode: z.enum(["local", "shareable"]),
    players: playersSchema,
    createdAt: z.number(),
    updatedAt: z.number(),
    phase: z.string().max(30),
    completed: z.boolean(),
    state,
  }) as unknown as z.ZodType<GameSession<S>>;
}

/** Random identifier for a local session. Not a credential or proof of identity. */
export function newSessionId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

const sessionKey = (gameId: CoupleGameId) => `session:${gameId}`;

/** Summary of unfinished sessions for the hub's "Continue playing" row. */
const sessionSummary = z.object({
  gameId: gameIdSchema,
  phase: z.string(),
  updatedAt: z.number(),
  completed: z.boolean(),
});
export async function listUnfinishedSessions() {
  const found: z.infer<typeof sessionSummary>[] = [];
  for (const id of COUPLE_GAME_IDS) {
    const raw = await getValidated(sessionKey(id), sessionSummary.passthrough());
    if (raw && !raw.completed) found.push(raw);
  }
  return found.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Loads a saved, unfinished session for this game (if valid) and offers a
 * debounced `save`. Corrupted records are dropped by validation.
 */
export function useGameSession<S>(gameId: CoupleGameId, state: z.ZodType<S>) {
  const schema = useRef(sessionSchema(gameId, state)).current;
  const [saved, setSaved] = useState<GameSession<S> | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let alive = true;
    void getValidated(sessionKey(gameId), schema).then((session) => {
      if (!alive) return;
      setSaved(session && !session.completed ? session : null);
      setLoaded(true);
    });
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [gameId, schema]);
  const save = useCallback(
    (session: GameSession<S>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void setItem(sessionKey(gameId), { ...session, updatedAt: Date.now() }).then((ok) =>
          setStorageWarning(!ok),
        );
      }, 250);
    },
    [gameId],
  );
  const discard = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setSaved(null);
    return removeItem(sessionKey(gameId));
  }, [gameId]);
  return { saved, loaded, save, discard, storageWarning };
}
