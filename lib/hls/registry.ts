// Opaque-token registry mapping rewritten HLS playlist/segment URLs back to the
// real provider URLs (which embed credentials). The browser only ever sees the
// token, so creds never leave the server.

interface Entry {
  url: string;
  exp: number;
}

const store = new Map<string, Entry>();
const TTL = 2 * 60 * 60 * 1000; // 2h
const MAX = 20_000;

function prune() {
  const now = Date.now();
  for (const [k, v] of store) if (v.exp < now) store.delete(k);
}

let counter = 0;
function newToken(): string {
  // unique + non-guessable enough for a local proxy
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function putUrl(url: string): string {
  if (store.size > MAX) prune();
  const token = newToken();
  store.set(token, { url, exp: Date.now() + TTL });
  return token;
}

export function getUrl(token: string): string | undefined {
  const e = store.get(token);
  if (!e) return undefined;
  if (e.exp < Date.now()) {
    store.delete(token);
    return undefined;
  }
  return e.url;
}
