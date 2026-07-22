# AssetScout AI

AssetScout AI helps game developers describe a 2D or 3D asset in plain language — "a low-poly
fantasy dragon, rigged for Unity URP mobile" — and finds real, live matches across four integrated
sources, ranked by a small AI model that runs entirely on the visitor's own device. No paid APIs, no
cloud AI inference, no scraping.

## The problem it solves

Finding a usable game asset today means opening half a dozen different marketplace tabs — each with
its own search syntax, licensing terms, and inconsistent metadata — and manually cross-checking
whether a result is actually free, actually the right format, and actually fits the project. AssetScout
collapses that into one search box: it queries every source it's actually integrated with in
parallel, normalizes the results into one consistent card format (price, license, format, engine
compatibility), and explains *why* each result matched — while being explicit about which of the ten
other well-known marketplaces it only links out to, rather than pretending to search everywhere.

## Live architecture

```
Browser
  │
  ├─ AI Search box ─── on-device MiniLM embedding (Transformers.js, WASM/WebGPU)
  │                     ranks results by meaning, not just keyword overlap
  │
  └─ /api/providers/*  ── our own Route Handlers (server-side only)
        ├─ polyhaven   → serves a versioned static catalog (see below) — no live
        │                 fetch to Poly Haven on a normal request
        ├─ sketchfab   → live search against Sketchfab's public API (Next.js
        │                 fetch cache, ~1h per query)
        ├─ pixabay     → live search against Pixabay's API (Next.js fetch cache,
        │                 24h per query — Pixabay's API terms require this)
        └─ kenney      → statically bundled catalog, zero network calls at all
```

Every result — regardless of source — is normalized into one `AssetSearchResult` shape before it
ever reaches a component, so the UI never has to special-case a provider's raw response format.

## Integrated sources vs. outbound marketplaces

AssetScout is explicit, in the UI itself (see the `/sources` page and the note next to every result
count) about the difference between:

- **Live API integrations** — queried live, per search, through AssetScout's own server:
  **Poly Haven** (HDRIs, textures, 3D models — CC0), **Sketchfab** (3D models — license varies per
  model), **Pixabay** (photos, illustrations, vectors — Pixabay Content License).
- **Authorized indexed catalog** — a versioned static snapshot regenerated periodically from the
  source's own official feed, not fetched live per search: **Kenney** (CC0; the ~25 most recent
  releases from Kenney's own public feed, not its full historical library).
- **External marketplace links** (10 total: Unity Asset Store, Fab, itch.io, OpenGameArt, CraftPix,
  ArtStation Marketplace, GameDev Market, TurboSquid, CGTrader, Mixamo) — AssetScout only generates a
  link to the marketplace's own site. **It never searches, scrapes, retrieves, or verifies anything
  from these** — always confirm price, license, and compatibility on the marketplace itself.

AssetScout never claims "all marketplaces searched" — the result count and header text only ever
describe the 4 integrated sources above, and only when they genuinely returned results for that
query.

## Local semantic AI, explained honestly

Search relevance ranking runs a small (~23MB, q8-quantized) sentence-embedding model
(`Xenova/all-MiniLM-L6-v2`) entirely **in the visitor's own browser**, via
[Transformers.js](https://huggingface.co/docs/transformers.js) — downloaded once from Hugging Face's
CDN (cached by the browser afterward), never sent to any server we operate, and costing us nothing
per query. It compares the meaning of a search phrase against a precomputed embedding for every Poly
Haven asset (generated ahead of time, shipped as a static `.bin` file) and re-ranks results by cosine
similarity.

**Honesty boundary:** this model is English-only — it has no meaningful cross-lingual retrieval
ability. A query written in Hebrew, Arabic, or another non-Latin script is detected and shown an
explicit "no English matches for this query" state instead of either silently failing or flooding the
page with irrelevant results reordered by a model that has no real signal for that language. A
Transformers.js-compatible multilingual model was researched and benchmarked (see
`poc/multilingual-hebrew-search/`) and works well, but at ~6× the download size — it's an isolated
proof of concept, not wired into production yet. AssetScout does not claim full Hebrew (or other
non-English) AI search support.

## Privacy & zero-cloud-AI-cost design

- No OpenAI, Gemini, or any paid inference API is called, ever.
- The only "AI" in this app is the local embedding model above — it runs on the visitor's CPU/GPU,
  not ours, so there is no per-query inference cost and no query text is ever sent to a third-party
  AI provider.
- Favorites are stored in `localStorage` only — nothing about what a visitor saves is sent to or
  stored on any server.
- The one required secret (`PIXABAY_API_KEY`) is read server-side only, inside a Route Handler that
  never forwards it to the browser — see [Security](#security) below.

## Technology stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack, React Server Components) — deployed as a
  standard Vercel (Hobby-tier-compatible) app.
- [React 19](https://react.dev) / TypeScript (strict mode, no `any`).
- [Tailwind CSS 4](https://tailwindcss.com) (CSS-first theme, no `tailwind.config.js`).
- [@huggingface/transformers](https://huggingface.co/docs/transformers.js) (Transformers.js) for
  in-browser semantic search — no server-side ML inference.
- [lucide-react](https://lucide.dev) for icons.
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) for unit/component
  tests.

## Features

- Natural-language search across Poly Haven, Sketchfab, Pixabay, and Kenney, combined and deduplicated.
- On-device semantic re-ranking with a visible, honest status ("AI Match" vs. deterministic keyword
  relevance — never conflated).
- Category (2D/3D), pricing, license, engine, format, and style filters; quick "project" context chips.
- Favorites, persisted locally, resolved back to a live/fresh source lookup (never a stale cached
  copy) whenever a favorited item can't be recovered from a plain browse query (e.g. Sketchfab).
- An honest per-provider status: partial-failure banner when a source is temporarily down, and a
  distinct notice for queries in an unsupported language — never silently wrong.
- Full-object, non-cropped, non-distorted asset previews (`object-contain`, capped upscaling) with a
  graceful CSS/gradient placeholder for missing or failed thumbnails.
- An outbound "search more marketplaces" hub for the 10 non-integrated sources, clearly labeled as
  external links only.
- A `/sources` page documenting exactly what "live" means for every single source.

## Architecture overview

```
src/
  app/                       Routes: "/" (Explore), "/favorites", "/sources"; layout, metadata,
                             sitemap.ts, robots.ts, not-found.tsx, error.tsx
    api/providers/*/route.ts Server-only Route Handlers — the only code allowed to call an external
                             provider API directly or read its API key
  components/
    layout/                  Header, mobile nav, footer
    search/                  Search bar, quick chips, category toggle, marketplace hub, page orchestration
    filters/                 Filter sidebar (desktop) / drawer (mobile)
    assets/                  Result card, grid, preview, match score, favorite button, results header
    states/                  Loading, empty, and error state components
  domain/asset/              Normalized AssetSearchResult model, AssetSearchQuery, AssetSearchProvider contract
  lib/
    providers/<name>/        fetch-assets.ts (server-only network + parsing), normalize.ts, raw-types.ts
                             (untrusted-input type guards), provider.ts (client-side AssetSearchProvider)
    search/                  Pure filter/sort/tokenize/relevance functions — no React, no I/O
    semantic/                Browser-only Transformers.js runtime, embedding manifest, catalog-version hash
    marketplaces/            Outbound-link registry for the 10 external marketplaces (zero network calls)
    sources/                 Per-source "what kind of connection is this" metadata, powers /sources
  data/
    polyhaven-catalog/        Versioned static Poly Haven catalog + manifest (see below)
    kenney-catalog/            Versioned static Kenney catalog + manifest
  hooks/                     useAssetSearch, useSemanticRanking, useFavorites
scripts/                     One-off generation scripts (never run at build time — see below)
poc/                         Isolated, non-production research scripts (never imported by the app)
public/semantic-search/      Generated embeddings.bin + manifest.json, served as static files
```

Key architectural rules this codebase follows (enforced version in `AGENTS.md`):

- **UI components never see provider-specific shapes** — everything is normalized to
  `AssetSearchResult` first.
- **Filter/sort/ranking logic is pure** — no React, no `window`/`localStorage`, unit tested in isolation.
- **External providers are called server-side only**, from that provider's own Route Handler — client
  code always calls our own `/api/providers/<name>` route, never the third-party API directly.
- **`localStorage` access is SSR-safe**, funneled through `lib/storage.ts` / `useSyncExternalStore`.
- **No state-management library, no `any`.**

## Provider modes

| Source | Mode | Network calls at request time |
|---|---|---|
| Poly Haven | Live API (catalog served from a committed static snapshot) | None in the normal case — see [Poly Haven catalog strategy](#poly-haven-catalog-strategy) |
| Sketchfab | Live API | Yes, per distinct query text (cached ~1h) |
| Pixabay | Live API | Yes, per distinct query text (cached 24h, per Pixabay's API terms) |
| Kenney | Authorized indexed catalog | None — statically bundled at build time |
| 10 external marketplaces | Outbound link only | None — AssetScout never fetches them |

## Poly Haven catalog strategy

Poly Haven's `/assets` endpoint returns its entire catalog in one ~3MB response with no
search/pagination support. Fetching that live on every request is both slow and unreliable on a
serverless platform like Vercel, where a process-local in-memory cache provides little benefit — a
cold function instance has no memory of a previous one's cache, so a naive live-fetch-and-cache
strategy could mean a live ~3MB fetch (and a real risk of hitting the function's execution time
limit) on a meaningful fraction of requests.

**Fix:** the catalog is fetched and normalized *once*, deliberately, via
`npm run polyhaven:generate`, and committed as a versioned static file
(`src/data/polyhaven-catalog/catalog.json`, ~2.4MB). The `/api/providers/polyhaven` route serves this
directly — zero network calls, zero parse cost, at request time — and only falls back to a live fetch
(with the original in-memory cache) in the unexpected case where that file is missing or fails
validation.

### Catalog & embeddings refresh

The semantic embeddings artifact is generated *from* the committed catalog file (not from an
independent live fetch), so the two can never silently drift apart. Refresh both together:

```bash
npm run catalog:refresh   # = npm run polyhaven:generate && npm run embeddings:generate
```

Or individually:

```bash
npm run polyhaven:generate   # re-fetches Poly Haven live, writes src/data/polyhaven-catalog/{catalog,manifest}.json
npm run embeddings:generate  # reads that catalog, writes public/semantic-search/{embeddings.bin,manifest.json}
npm run kenney:generate      # unrelated to Poly Haven — refreshes Kenney's catalog from its own feed
```

None of these run automatically during `next build` or on Vercel — regeneration is a deliberate,
explicit step (a CI job hitting a third-party API on every deploy is both slower and less reliable
than a developer running it when the catalog is actually known to have changed). A committed test
(`src/lib/semantic/catalog-embeddings-consistency.test.ts`) fails the build if the two artifacts are
ever committed out of sync with each other.

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To reach it from another device (e.g. a phone) on the same Wi-Fi:

```bash
npm run dev -- --hostname 0.0.0.0
```

then visit `http://<your-computer's-LAN-IP>:3000` from that device. (Both devices must be on the same
network, off any VPN; Wi-Fi client isolation on some networks/routers can still block this even when
the app itself is configured correctly.)

## Environment setup

Copy `.env.example` to `.env.local` and fill in real values — **never commit `.env.local`** (already
gitignored).

| Variable | Required? | Notes |
|---|---|---|
| `PIXABAY_API_KEY` | Yes, for Pixabay results | Free key from [pixabay.com/api/docs](https://pixabay.com/api/docs/). Read server-side only; omitting it just omits Pixabay from results (with a non-blocking notice) — everything else still works. |
| `SKETCHFAB_API_TOKEN` | No | Sketchfab's search works fully unauthenticated. An optional free token raises your own rate limit. |
| `NEXT_PUBLIC_SITE_URL` | No | This app's own public URL, used for canonical links/sitemap/OG metadata. Falls back to `http://localhost:3000`. |

### Vercel environment variables

When deploying, add these in the Vercel project's **Settings → Environment Variables** (variable
names only — never paste a real value into a README, commit, or screenshot):

| Variable | Production | Preview | Development |
|---|---|---|---|
| `PIXABAY_API_KEY` | ✅ | ✅ | ✅ |
| `SKETCHFAB_API_TOKEN` | optional | optional | optional |
| `NEXT_PUBLIC_SITE_URL` | ✅ (set to the final `https://…vercel.app` URL) | optional | not needed |

## Test commands

```bash
npm run lint     # ESLint (eslint-config-next)
npm run test     # Vitest — unit + component tests (pure logic, provider parsing, catalog consistency)
npm run build    # Production build (Turbopack)
npm run start    # Serve the production build locally
```

## Deployment

This app is designed to fit Vercel's **Hobby (free) tier** at its current scale: no paid add-ons, no
background jobs, no database. To deploy:

1. Push this repository to GitHub.
2. Import it into Vercel.
3. Add the environment variables listed above (at minimum `PIXABAY_API_KEY`).
4. Deploy — no build command changes needed (`next build` / `next start` are Vercel's defaults).

## Known limitations

- Hebrew and other non-Latin-script queries are honestly unsupported for AI ranking today (see
  [Local semantic AI](#local-semantic-ai-explained-honestly)) — a multilingual model was benchmarked
  but not shipped, pending a deliberate size/performance tradeoff decision.
- Poly Haven's static catalog is a point-in-time snapshot — brand-new Poly Haven releases won't
  appear until someone runs `npm run catalog:refresh`.
- Kenney's catalog covers only its ~25 most recent public-feed releases, not its full historical library.
- Sketchfab result relevance depends entirely on Sketchfab's own search relevance — AssetScout applies
  no additional text filtering on top of it.
- The 10 external marketplaces are outbound links only; AssetScout has no visibility into whether a
  given search actually returns anything there.
- No live-demo URL is published yet.

## Roadmap

- Decide on and ship (or explicitly reject) the multilingual embedding model from the
  `poc/multilingual-hebrew-search/` research.
- Investigate a genuinely free Hebrew→English translation path for the two live-search providers
  (Sketchfab, Pixabay), which today only receive the raw, un-translated query text.
- Pagination/infinite scroll for very large result sets.
- A persisted "Project Profile" (engine, render pipeline, target platform) that search/ranking can use
  as durable context.

## License & third-party attribution

This project's own source code does not yet have a chosen open-source license (to be decided before
any public release). Third-party data and models keep their own original licenses, always shown
per-result where they vary:

- **Poly Haven** assets — CC0 (public domain).
- **Kenney** assets — CC0 (public domain).
- **Sketchfab** models — license varies per model, shown on every result card.
- **Pixabay** images — Pixabay Content License.
- **`Xenova/all-MiniLM-L6-v2`** (the local semantic model) — Apache-2.0, via
  [Transformers.js](https://huggingface.co/docs/transformers.js).

## Security

- `PIXABAY_API_KEY` / `SKETCHFAB_API_TOKEN` are read only inside server-only Route Handlers
  (`src/app/api/providers/**/route.ts`) and their shared `fetch-assets.ts` modules — never imported by
  any client component, and verified absent from the built client bundle.
- Error responses from every API route return a short, generic message — never the upstream URL,
  raw upstream error body, or whether a token/key is configured.
- Standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS) are set in `next.config.ts`. A `Content-Security-Policy` was
  deliberately not added — the local model download (Hugging Face's CDN, multiple/rotating hosts)
  isn't fully enumerable without live testing every host, and an under-tested CSP risks silently
  breaking model loading, remote images, or the external marketplace links.

---

Built by **Elioz Kolani** — [GitHub](https://github.com/Eliozk) ·
[LinkedIn](https://www.linkedin.com/in/elioz-kolani)
