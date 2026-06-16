// TTL cache for catalog JSON with an on-disk layer. The Xtream API is slow and
// unpaginated (the full VOD list can take 20s+), so we fetch once and persist to
// disk — like the SQLite-backed players — so server restarts don't re-pay it.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface Entry {
  value: unknown;
  expires: number;
}

const store = new Map<string, Entry>();
const DEFAULT_TTL = 10 * 60 * 1000;

const CACHE_DIR = process.env.LUMEN_CACHE_DIR || join(tmpdir(), "lumen-cache");
let dirReady = false;
function ensureDir() {
  if (dirReady) return;
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
  dirReady = true;
}
function fileFor(key: string) {
  return join(CACHE_DIR, createHash("sha1").update(key).digest("hex") + ".json");
}

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown, ttl = DEFAULT_TTL): void {
  store.set(key, { value, expires: Date.now() + ttl });
}

function diskGet<T>(key: string): T | undefined {
  ensureDir();
  try {
    const raw = readFileSync(fileFor(key), "utf8");
    const entry = JSON.parse(raw) as Entry;
    if (Date.now() > entry.expires) return undefined;
    return entry.value as T;
  } catch {
    return undefined;
  }
}

function diskSet(key: string, value: unknown, ttl: number): void {
  ensureDir();
  try {
    writeFileSync(fileFor(key), JSON.stringify({ value, expires: Date.now() + ttl }));
  } catch {
    /* best-effort */
  }
}

/** Wrap an async producer with memory + disk cache. */
export async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const mem = cacheGet<T>(key);
  if (mem !== undefined) return mem;

  const disk = diskGet<T>(key);
  if (disk !== undefined) {
    cacheSet(key, disk, ttl); // promote to memory
    return disk;
  }

  const value = await fn();
  cacheSet(key, value, ttl);
  diskSet(key, value, ttl);
  return value;
}
