# AssetScout

**A federated search platform for discovering game-development assets across multiple providers.**

## Quick links

[![Open Live Demo](https://img.shields.io/badge/Open%20Live%20Demo-asset--scout--ai.vercel.app-3b82f6?style=for-the-badge)](https://asset-scout-ai.vercel.app)
<br>
[![View Source on GitHub](https://img.shields.io/badge/View%20Source%20on%20GitHub-Eliozk%2Fasset--scout--ai-181717?style=for-the-badge&logo=github)](https://github.com/Eliozk/asset-scout-ai)

## Project status

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org)
<br>
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
<br>
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
<br>
[![Tests](https://img.shields.io/badge/tests-396%20passing-22c55e?style=flat-square)](#testing)

<img src="docs/screenshots/asset-scout-desktop.webp" alt="AssetScout desktop screenshot — a 'car kit' search returning normalized results from Kenney and Pixabay, each with source, license, and AI-relevance labels" width="100%" />

## Overview

AssetScout is a full-stack, federated search platform for game-development assets. It queries four
independent providers in parallel — Poly Haven, Sketchfab, Kenney, and Pixabay — normalizes their
very different response shapes into one consistent result card (price, license, format, engine
compatibility), and re-ranks the combined results with a small AI model that runs **entirely on the
visitor's own device**. No paid APIs, no cloud AI inference, no scraping.

## Problem solved

Finding a usable game asset today means opening half a dozen marketplace tabs — each with its own
search syntax, licensing terms, and inconsistent metadata — and manually cross-checking whether a
result is actually free, actually the right format, and actually fits the project. AssetScout
collapses that into one search box, while being explicit about which results are genuinely
integrated and which are just outbound links to other marketplaces, rather than pretending to
search everywhere.

## Key features

- Natural-language search across Poly Haven, Sketchfab, Pixabay, and Kenney, combined and deduplicated.
- On-device semantic re-ranking with a visible, honest status ("AI Match" vs. deterministic keyword
  relevance — never conflated), and a provider-agnostic hybrid ranker: a strong literal match from a
  non-embedded source can outrank a weak semantic guess instead of always losing to it.
- Category (2D/3D), pricing, license, engine, format, and style filters; quick "project" context chips.
- Favorites, persisted locally, resolved back to a live/fresh source lookup whenever a favorited item
  can't be recovered from a plain browse query (e.g. Sketchfab, Pixabay) — plus a floating quick-access
  button with a live saved count.
- An honest per-provider status: a partial-failure banner when a source is temporarily down, and a
  distinct notice for queries in an unsupported language — never silently wrong.
- Full-object, non-cropped, non-distorted asset previews (`object-contain`, capped upscaling) with a
  graceful CSS/gradient placeholder for missing or failed thumbnails.
- An outbound "search more marketplaces" hub for 10 non-integrated sources, clearly labeled as
  external links only.
- A `/sources` page documenting exactly what "live" means for every single source, and a `/legal`
  page with accurate privacy/terms disclosures.

## Integrated providers

Results from these four sources are fetched, normalized, and ranked **inside** AssetScout:

| Provider | Mode | What's returned | License |
|---|---|---|---|
| **Poly Haven** | Live API (served from a periodically refreshed static snapshot) | HDRIs, textures, 3D models | CC0 |
| **Sketchfab** | Live API, real server-side search | 3D models | Varies per model, shown on every card |
| **Pixabay** | Live API, real server-side search | Photos, illustrations, vectors | Pixabay Content License |
| **Kenney** | Authorized indexed catalog (versioned static snapshot) | 2D sprites, 3D kits, textures | CC0 |

## External marketplace links

These 10 marketplaces are **outbound links only** — AssetScout does not search, scrape, retrieve, or
verify anything from them:

Unity Asset Store · Fab · itch.io · OpenGameArt · CraftPix · CGTrader · ArtStation Marketplace ·
GameDev Market · TurboSquid · Mixamo

**In short: four providers return normalized results inside AssetScout; ten marketplaces are external
links only, opened in a new tab. AssetScout never claims "all marketplaces searched," and always
verify a result's actual license, price, availability, and download rights on its original source
before using it.**

## Search & ranking approach

Every result is normalized into one shape before it reaches a component, then ranked in two layers:

1. **Deterministic keyword relevance** — a pure, unit-tested AND-match over name/description/tags,
   always available, always explainable ("Matches 'car, kit'").
2. **On-device semantic re-ranking** — once a small (~23MB, q8-quantized) sentence-embedding model
   (`Xenova/all-MiniLM-L6-v2`, via [Transformers.js](https://huggingface.co/docs/transformers.js))
   finishes loading in the browser, it compares the meaning of the query against a precomputed
   embedding for every Poly Haven asset. Sources without a precomputed embedding (Sketchfab, Pixabay,
   Kenney) are never silently excluded or unconditionally demoted — they keep their own deterministic
   score and compete directly against semantic scores on the same 0–100 scale, so a strong literal
   match still wins over a weak semantic guess.

**Honesty boundary:** the model is English-only. A query in Hebrew, Arabic, or another non-Latin
script is detected and shown an explicit "no English matches for this query" state, instead of either
failing silently or flooding the page with results reordered by a model that has no real signal for
that language. A multilingual model was researched and benchmarked (`poc/multilingual-hebrew-search/`)
but is not shipped — it's roughly 6× the download size, a deliberate tradeoff not yet made.

## Architecture

```
Browser
  │
  ├─ AI Search box ─── on-device MiniLM embedding (Transformers.js, WASM/WebGPU)
  │                     ranks results by meaning, not just keyword overlap
  │
  └─ /api/providers/*  ── our own Route Handlers (server-side only)
        ├─ polyhaven   → serves a versioned static catalog — no live fetch on a normal request
        ├─ sketchfab   → live search against Sketchfab's public API (Next.js fetch cache, ~1h)
        ├─ pixabay     → live search against Pixabay's API (Next.js fetch cache, 24h — required
        │                 by Pixabay's API terms)
        └─ kenney      → statically bundled catalog, zero network calls at all
```

```
src/
  app/                       Routes: "/" (Explore), "/favorites", "/sources", "/legal"; layout,
                             metadata, sitemap.ts, robots.ts, not-found.tsx, error.tsx
    api/providers/*/route.ts Server-only Route Handlers — the only code allowed to call an external
                             provider API directly or read its API key
  components/                layout / search / filters / assets / states
  domain/asset/              Normalized AssetSearchResult model, AssetSearchQuery, AssetSearchProvider contract
  lib/
    providers/<name>/        fetch-assets.ts (server-only), normalize.ts, raw-types.ts, provider.ts
    search/                  Pure filter/sort/tokenize/relevance/ranking functions — no React, no I/O
    semantic/                Browser-only Transformers.js runtime, embedding manifest, catalog-version hash
    marketplaces/            Outbound-link registry for the 10 external marketplaces (zero network calls)
  data/                      Versioned static Poly Haven + Kenney catalogs (committed, not caches)
  hooks/                     useAssetSearch, useSemanticRanking, useFavorites
scripts/                     One-off generation scripts (never run at build time)
poc/                         Isolated, non-production research scripts (never imported by the app)
public/semantic-search/      Generated embeddings.bin + manifest.json, served as static files
```

Key architectural rules this codebase follows (enforced version in `AGENTS.md`):

- **UI components never see provider-specific shapes** — everything is normalized to
  `AssetSearchResult` first.
- **Filter/sort/ranking logic is pure** — no React, no `window`/`localStorage`, unit tested in isolation.
- **External providers are called server-side only**, from that provider's own Route Handler.
- **`localStorage` access is SSR-safe**, funneled through `lib/storage.ts` / `useSyncExternalStore`.
- **No state-management library, no `any`.**

### Poly Haven catalog strategy

Poly Haven's `/assets` endpoint returns its entire catalog in one ~3MB response with no
search/pagination support. Fetching that live on every request is slow and unreliable on a
serverless platform, where a process-local cache doesn't survive across cold-started instances.
Instead, the catalog is fetched and normalized once, deliberately, via `npm run polyhaven:generate`,
and committed as a versioned static file. The route serves this directly — zero network calls at
request time — falling back to a live fetch only if that file is ever missing or invalid.

The semantic embeddings artifact is generated *from* that same committed catalog (never an
independent live fetch), so the two can never silently drift — enforced by a committed consistency
test. Refresh both together with `npm run catalog:refresh`.

## Reliability and security

- `PIXABAY_API_KEY` / `SKETCHFAB_API_TOKEN` are read only inside server-only Route Handlers — never
  imported by any client component, and verified absent from the built client bundle.
- Error responses from every API route return a short, generic message — never the upstream URL, raw
  upstream error body, or whether a token/key is configured.
- Standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS) are set in `next.config.ts`. A `Content-Security-Policy` was
  deliberately not added — the local model download (Hugging Face's CDN, multiple/rotating hosts)
  isn't fully enumerable without live testing every host, and an under-tested CSP risks silently
  breaking model loading, remote images, or the external marketplace links.
- No user accounts, no payment processing, no tracking cookies or analytics.
- See [`/legal`](https://asset-scout-ai.vercel.app/legal) for the full privacy/terms notice — it
  makes no guarantee of permanent zero cost or blanket legal compliance in every jurisdiction, and
  says so directly.

## Responsive design

The layout is mobile-first (`grid-cols-1` by default, expanding at `sm:`/`xl:` breakpoints), with a
collapsible mobile nav and a floating Favorites shortcut that stays reachable with one tap instead of
being buried behind a menu.

<img src="docs/screenshots/asset-scout-mobile.webp" alt="AssetScout mobile screenshot — responsive single-column layout with the floating Favorites button" width="320" />

## Technology stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack, React Server Components), deployed on
  Vercel's Hobby (free) tier.
- [React 19](https://react.dev) / TypeScript (strict mode, no `any`).
- [Tailwind CSS 4](https://tailwindcss.com) (CSS-first theme, no `tailwind.config.js`).
- [@huggingface/transformers](https://huggingface.co/docs/transformers.js) (Transformers.js) for
  in-browser semantic search — no server-side ML inference, no OpenAI/Gemini/cloud AI of any kind.
- [lucide-react](https://lucide.dev) for icons.
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) for unit/component
  tests.

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values — **never commit `.env.local`** (already
gitignored).

| Variable | Required? | Notes |
|---|---|---|
| `PIXABAY_API_KEY` | Yes, for Pixabay results | Free key from [pixabay.com/api/docs](https://pixabay.com/api/docs/). Read server-side only; omitting it just omits Pixabay from results — everything else still works. |
| `SKETCHFAB_API_TOKEN` | No | Sketchfab's search works fully unauthenticated. An optional free token raises your own rate limit. |
| `NEXT_PUBLIC_SITE_URL` | No | This app's own public URL, used for canonical links/sitemap/OG metadata. Falls back to `http://localhost:3000`. |

## Testing

```bash
npm run lint     # ESLint (eslint-config-next) — passing
npm run test     # Vitest — 396 automated tests passing
npm run build    # Production build (Turbopack) — verified
npm run start    # Serve the production build locally
```

Tests cover pure filter/sort/tokenize/relevance/ranking logic, provider response parsing against
untrusted-input type guards, catalog/embeddings consistency, and key UI components.

## Deployment

Deployed on Vercel's **Hobby (free) tier** — no paid add-ons, no background jobs, no database.

1. Push to GitHub.
2. Import into Vercel.
3. Add the environment variables above (at minimum `PIXABAY_API_KEY`).
4. Deploy — `next build` / `next start` are Vercel's defaults, no changes needed.

## Known limitations

- Hebrew and other non-Latin-script queries are honestly unsupported for AI ranking today (see
  [Search & ranking approach](#search--ranking-approach)).
- Poly Haven's static catalog is a point-in-time snapshot — new releases won't appear until someone
  runs `npm run catalog:refresh`.
- Kenney's catalog covers only its ~25 most recent public-feed releases, not its full historical library.
- Sketchfab result relevance depends entirely on Sketchfab's own search relevance.
- The 10 external marketplaces are outbound links only; AssetScout has no visibility into what they return.
- Operating on free tiers today is a description of how the project currently runs, not a permanent
  guarantee — see `/legal`.

## Roadmap

- Decide on and ship (or explicitly reject) the multilingual embedding model from
  `poc/multilingual-hebrew-search/`.
- Investigate a genuinely free Hebrew→English translation path for the live-search providers.
- Pagination/infinite scroll for very large result sets.
- A persisted "Project Profile" (engine, render pipeline, target platform) that search/ranking can use
  as durable context.

## Attribution and legal notes

This project's own source code does not yet have a chosen open-source license. Third-party data and
models keep their own original licenses, always shown per-result where they vary:

- **Poly Haven** assets — CC0 (public domain).
- **Kenney** assets — CC0 (public domain).
- **Sketchfab** models — license varies per model, shown on every result card.
- **Pixabay** images — Pixabay Content License.
- **`Xenova/all-MiniLM-L6-v2`** (the local semantic model) — Apache-2.0, via
  [Transformers.js](https://huggingface.co/docs/transformers.js).

AssetScout is a discovery tool, not a seller or licensor of any asset — see
[`/legal`](https://asset-scout-ai.vercel.app/legal) for the full notice.

---

Built by **Elioz Kolani** — [GitHub](https://github.com/Eliozk) ·
[LinkedIn](https://www.linkedin.com/in/elioz-kolani)
