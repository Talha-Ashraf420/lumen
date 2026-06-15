# Lumen — Cinematic IPTV / Xtream Web Player

A self-hosted, single-user web app that logs into your **Xtream Codes / X3U stream codes**
(server URL + username + password) and plays **everything** — Live TV, Movies and Series —
in a clean, cinematic, dark UI.

> Bring your own IPTV subscription. Lumen is just the player.

## Features

- **Login** with your Xtream/X3U codes — multi-profile (save several logins, switch fast).
- **Live TV** — categories, channel grid/list, **now/next EPG** with a live progress bar, favourites.
- **Movies (VOD)** — categories, poster grid, detail pages (plot, cast, rating, year), **resume**.
- **Series** — seasons & episodes, **resume per-episode**, **auto next-episode**.
- **Play everything** — `mpegts.js` for Live/TS, `hls.js` for `.m3u8`, native for `.mp4`.
- **Sort & search** — A→Z / Z→A, Recently Added, Year, Top Rated, per-section filter, and
  a **global search** across Live + Movies + Series.
- **My List** (favourites) + **Continue Watching** shelves on Home.
- Custom player: play/pause, seek, volume, **PiP**, fullscreen, keyboard shortcuts, Live badge.

## How it works

Browsers can't call IPTV servers directly (CORS) and can't natively play MPEG-TS. Lumen runs a
small server-side proxy (Next.js Route Handlers) that:

1. Holds your credentials in an **httpOnly cookie** (never exposed to client JS).
2. Proxies `player_api.php` JSON at `/api/xtream` (same-origin → no CORS).
3. Pipes the media bytes at `/api/stream` (Range-aware, so VOD seeking works).

```
Browser (React UI) → /api/xtream + /api/stream (Next.js) → your IPTV provider
```

## Run it

```bash
cd lumen
npm install        # already done if you scaffolded
npm run dev        # http://localhost:3000
```

Then open <http://localhost:3000>, enter your **Server URL** (e.g. `http://your-host:8080`),
**username** and **password**, and connect.

Production build:

```bash
npm run build && npm start
```

## Where your data lives

- **Credentials** — httpOnly session cookie on this device + an optional saved-profile list in
  `localStorage` (so the login screen remembers accounts). Nothing is sent anywhere except your
  own IPTV provider.
- **Favourites / Continue-Watching / Recent** — `localStorage` (`lumen-library`).

## Playback notes

- **Live TV** is usually MPEG-TS → played via `mpegts.js` (MSE). Some providers also offer `.m3u8`.
- **Movies/Series** are typically `.mp4` (native). **`.mkv` / `.avi`** often can't play in any
  browser — Lumen shows a clear notice; use VLC for those, or add the optional ffmpeg remux later.

## Keyboard shortcuts (player)

`space` play/pause · `←/→` seek 10s · `↑/↓` volume · `f` fullscreen · `m` mute · `Esc` back

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · TanStack Query · Zustand ·
mpegts.js · hls.js · Framer Motion.

```
app/(app)/        authenticated shell (home, live, movies, series, search, favourites)
app/login/        credential entry + saved profiles
app/watch/        fullscreen player route
app/api/          auth · xtream (catalog proxy) · stream (media proxy) · epg
lib/xtream/       typed Xtream client, types, URL builders
lib/player/       engine.ts — picks mpegts/hls/native
components/        catalog (Hero, Shelf, PosterCard, FilterBar, browsers), player, layout, ui
store/            zustand library (profiles, favourites, progress)
```

## Future hooks (not in v1)

- **TMDB enrichment** — richer posters/cast/plots (clean seam in `PosterCard` + detail pages).
- **ffmpeg remux** for `.mkv`/unsupported codecs (transcode in `/api/stream`).
- Chromecast / AirPlay, PWA install, full XMLTV grid EPG.

---

For personal use only. You are responsible for the legality of the IPTV service you connect to.
