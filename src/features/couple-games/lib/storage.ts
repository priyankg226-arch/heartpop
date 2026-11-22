import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";

/**
 * Tiny versioned key-value store on IndexedDB for couple games.
 * Falls back to an in-memory map if IndexedDB is unavailable (private mode,
 * blocked storage, old browsers). Browser data can be cleared at any time, so
 * nothing stored here is guaranteed to last.
 */
const DB_NAME = "heartpop-couple-games";
const STORE = "kv";
export const STORAGE_SCHEMA_VERSION = 1;
const VERSION_KEY = "meta:schema";

let dbPromise: Promise<IDBDatabase | null> | null = null;
const memory = new Map<string, unknown>();
const listeners = new Set<(key: string) => void>();

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE))
          request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  }).then(async (db) => {
    if (db) await migrate(db);
    return db;
  });
  return dbPromise;
}

function run<T>(db: IDBDatabase, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error ?? request.error);
    tx.onabort = () => reject(tx.error ?? new Error("Storage transaction aborted"));
  });
}

/** Schema migrations. v0 (no marker) → v1: nothing to transform yet. */
async function migrate(db: IDBDatabase) {
  try {
    const current = (await run(db, "readonly", (s) => s.get(VERSION_KEY))) as number | undefined;
    if (current === STORAGE_SCHEMA_VERSION) return;
    // Future: transform records written by older schema versions here.
    await run(db, "readwrite", (s) => s.put(STORAGE_SCHEMA_VERSION, VERSION_KEY));
  } catch {
    /* A failed migration must not break gameplay. */
  }
}

export async function getItem(key: string): Promise<unknown> {
  const db = await openDb();
  if (!db) return memory.get(key);
  try {
    return await run(db, "readonly", (s) => s.get(key));
  } catch {
    return memory.get(key);
  }
}

/** Returns false when the value could not be saved durably (e.g. quota exceeded). */
export async function setItem(key: string, value: unknown): Promise<boolean> {
  memory.set(key, value);
  const db = await openDb();
  let ok = false;
  if (db) {
    try {
      await run(db, "readwrite", (s) => s.put(value, key));
      ok = true;
    } catch {
      ok = false;
    }
  }
  listeners.forEach((listener) => listener(key));
  return ok;
}

export async function removeItem(key: string) {
  memory.delete(key);
  const db = await openDb();
  if (db) {
    try {
      await run(db, "readwrite", (s) => s.delete(key));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((listener) => listener(key));
}

/** Deletes every couple-game record on this device. */
export async function clearAll() {
  memory.clear();
  const db = await openDb();
  if (db) {
    try {
      await run(db, "readwrite", (s) => s.clear());
      await run(db, "readwrite", (s) => s.put(STORAGE_SCHEMA_VERSION, VERSION_KEY));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((listener) => listener("*"));
}

export function subscribe(listener: (key: string) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Reads a key and validates it; corrupted or outdated records are discarded. */
export async function getValidated<T>(key: string, schema: z.ZodType<T>): Promise<T | undefined> {
  const raw = await getItem(key);
  if (raw === undefined) return undefined;
  const parsed = schema.safeParse(raw);
  if (parsed.success) return parsed.data;
  await removeItem(key);
  return undefined;
}

/** React state backed by the store. `ready` turns true once the saved value loaded. */
export function useStoredValue<T>(key: string, schema: z.ZodType<T>, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = () =>
      getValidated(key, schema).then((saved) => {
        if (!alive) return;
        setValue(saved ?? fallback);
        setReady(true);
      });
    void load();
    const off = subscribe((changed) => {
      if (changed === key || changed === "*") void load();
    });
    return () => {
      alive = false;
      off();
    };
    // fallback/schema are expected to be stable module-level values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = useCallback(
    (next: T) => {
      setValue(next);
      return setItem(key, next);
    },
    [key],
  );
  return [value, update, ready] as const;
}
