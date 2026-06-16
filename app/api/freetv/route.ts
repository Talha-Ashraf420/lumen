import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { cached } from "@/lib/xtream/cache";

export const runtime = "nodejs";

// Curated iptv-org categories (free, publicly available channels).
const CATEGORIES: Array<{ id: string; name: string }> = [
  { id: "news", name: "News" },
  { id: "sports", name: "Sports" },
  { id: "movies", name: "Movies" },
  { id: "series", name: "Series" },
  { id: "entertainment", name: "Entertainment" },
  { id: "music", name: "Music" },
  { id: "documentary", name: "Documentary" },
  { id: "kids", name: "Kids" },
  { id: "comedy", name: "Comedy" },
  { id: "lifestyle", name: "Lifestyle" },
  { id: "science", name: "Science" },
  { id: "travel", name: "Travel" },
  { id: "culture", name: "Culture" },
  { id: "cooking", name: "Cooking" },
  { id: "education", name: "Education" },
  { id: "family", name: "Family" },
  { id: "business", name: "Business" },
  { id: "classic", name: "Classic" },
  { id: "religious", name: "Religious" },
  { id: "animation", name: "Animation" },
];

// Curated popular countries (iptv-org playlist codes, verified to exist).
const COUNTRIES: Array<{ id: string; name: string }> = [
  { id: "us", name: "🇺🇸 United States" },
  { id: "uk", name: "🇬🇧 United Kingdom" },
  { id: "ca", name: "🇨🇦 Canada" },
  { id: "in", name: "🇮🇳 India" },
  { id: "pk", name: "🇵🇰 Pakistan" },
  { id: "ae", name: "🇦🇪 UAE" },
  { id: "sa", name: "🇸🇦 Saudi Arabia" },
  { id: "au", name: "🇦🇺 Australia" },
  { id: "de", name: "🇩🇪 Germany" },
  { id: "fr", name: "🇫🇷 France" },
  { id: "es", name: "🇪🇸 Spain" },
  { id: "it", name: "🇮🇹 Italy" },
  { id: "tr", name: "🇹🇷 Turkey" },
  { id: "br", name: "🇧🇷 Brazil" },
  { id: "mx", name: "🇲🇽 Mexico" },
  { id: "ru", name: "🇷🇺 Russia" },
  { id: "cn", name: "🇨🇳 China" },
  { id: "jp", name: "🇯🇵 Japan" },
  { id: "kr", name: "🇰🇷 South Korea" },
  { id: "ph", name: "🇵🇭 Philippines" },
  { id: "id", name: "🇮🇩 Indonesia" },
  { id: "ng", name: "🇳🇬 Nigeria" },
  { id: "za", name: "🇿🇦 South Africa" },
  { id: "eg", name: "🇪🇬 Egypt" },
  { id: "nl", name: "🇳🇱 Netherlands" },
  { id: "pl", name: "🇵🇱 Poland" },
  { id: "gr", name: "🇬🇷 Greece" },
  { id: "pt", name: "🇵🇹 Portugal" },
];

interface FreeChannel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
}

function parseM3U(text: string): FreeChannel[] {
  const lines = text.split("\n");
  const out: FreeChannel[] = [];
  let cur: Partial<FreeChannel> | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("#EXTINF")) {
      const name = line.slice(line.indexOf(",") + 1).trim();
      const logo = /tvg-logo="([^"]*)"/.exec(line)?.[1] || "";
      const group = /group-title="([^"]*)"/.exec(line)?.[1] || "";
      const id = /tvg-id="([^"]*)"/.exec(line)?.[1] || "";
      cur = { name, logo, group, id };
    } else if (line && !line.startsWith("#") && cur) {
      cur.url = line;
      if (/^https?:\/\//i.test(cur.url) && cur.name) {
        out.push({ id: cur.id || cur.url, name: cur.name!, logo: cur.logo || "", group: cur.group || "", url: cur.url });
      }
      cur = null;
    }
  }
  return out;
}

/**
 * Free Live TV from the public iptv-org lists.
 *   GET /api/freetv?list=categories   -> curated category list
 *   GET /api/freetv?category=news     -> channels in that category
 */
export async function GET(req: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const list = searchParams.get("list");
  if (list === "categories") return NextResponse.json({ categories: CATEGORIES });
  if (list === "countries") return NextResponse.json({ countries: COUNTRIES });

  const country = searchParams.get("country");
  const category = searchParams.get("category");

  let path: string;
  let key: string;
  if (country) {
    if (!COUNTRIES.some((c) => c.id === country)) {
      return NextResponse.json({ error: "Unknown country" }, { status: 400 });
    }
    path = `countries/${country}.m3u`;
    key = `freetv|country|${country}`;
  } else {
    const cat = category || "news";
    if (!CATEGORIES.some((c) => c.id === cat)) {
      return NextResponse.json({ error: "Unknown category" }, { status: 400 });
    }
    path = `categories/${cat}.m3u`;
    key = `freetv|cat|${cat}`;
  }

  try {
    const channels = await cached(key, 6 * 60 * 60 * 1000, async () => {
      const res = await fetch(`https://iptv-org.github.io/iptv/${path}`, {
        headers: { "User-Agent": "Lumen/1.0", Accept: "*/*" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`iptv-org ${res.status}`);
      return parseM3U(await res.text());
    });
    return NextResponse.json({ channels }, { headers: { "Cache-Control": "private, max-age=1800" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
