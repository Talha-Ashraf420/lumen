# Deploying Lumen

Lumen needs a **real container** (not serverless): it spawns **ffmpeg** for MKV
remuxing and holds **long-lived streaming connections**. So Vercel/Netlify won't
work. Use a container host. The repo ships a `Dockerfile` (Node 22 + ffmpeg) and
Next.js `standalone` output, so any Docker host works.

## Recommended free option: Render

No credit card required; free Docker web service.

1. Push this repo to GitHub (already done).
2. Go to <https://render.com> → **New → Blueprint** and select this repo
   (it reads `render.yaml`), **or** **New → Web Service → Docker** and pick the repo.
3. Plan: **Free**. Render builds the `Dockerfile` automatically.
4. (Recommended) In **Environment**, set **`SITE_PASSWORD`** to lock the public URL
   behind HTTP Basic auth (`SITE_USER` defaults to `lumen`). Without it, anyone with
   the URL can use your IPTV account.
5. Deploy → open the `*.onrender.com` URL → log in with your Xtream codes.

**Free-tier notes:** the service **sleeps after ~15 min idle** and cold-starts
(~30–60s) on the next request; outbound **bandwidth is capped (~100 GB/mo)** — and
video streaming burns bandwidth fast, so heavy watching may exhaust it.

## Alternatives (also free-ish, same Dockerfile)

- **Koyeb** — <https://koyeb.com>, free instance, Git/Docker deploy, no card.
- **Fly.io** — <https://fly.io>, small free allowance but **requires a card**
  (`fly launch` detects the Dockerfile).
- **Any VPS / home server** — `docker build -t lumen . && docker run -p 3000:3000 -e SITE_PASSWORD=… lumen`.
  Best for unmetered bandwidth and lowest latency to your IPTV provider.

## Run the container locally

```bash
docker build -t lumen .
docker run --rm -p 3000:3000 -e SITE_PASSWORD=changeme lumen
# open http://localhost:3000  (user: lumen)
```

## Heads-up on hosting a personal IPTV proxy

- All video flows **through the server**, so bandwidth is metered/billable on most hosts.
- Your IPTV credentials live on that host and the URL is public — **always set
  `SITE_PASSWORD`**.
- You are responsible for complying with your IPTV provider's terms and local law.
