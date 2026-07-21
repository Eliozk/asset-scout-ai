# AssetScout AI

AssetScout AI helps game developers describe a needed 2D or 3D game asset in natural language,
search across supported online sources, and understand *why* each result fits their project.

> **Demonstration data notice:** every search result, AI match score, and "why it fits" explanation
> in this build is hand-authored mock content. No external marketplace, search API, or AI model is
> connected yet. Nothing here should be treated as real pricing, licensing, or availability
> information.

## Current milestone

**Milestone 1 — Frontend foundation with mock data.**

This milestone delivers a polished, responsive Explore/Favorites experience backed entirely by an
in-memory mock dataset, plus the domain model and provider contracts that a future live
integration will plug into. No network calls, authentication, or paid services are used.

## Technology

- [Next.js 16](https://nextjs.org) (App Router, Turbopack, React Server Components)
- [React 19](https://react.dev) / TypeScript (strict mode)
- [Tailwind CSS 4](https://tailwindcss.com) (CSS-first theme, no `tailwind.config.js`)
- [lucide-react](https://lucide.dev) for icons
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) for unit tests

## Architecture overview

```
src/
  app/                  Routes (Explore "/" and "/favorites"), layout, global styles
  components/
    layout/             Header, mobile nav, logo, footer
    search/             Search hero, search bar, quick chips, category toggle, page orchestration
    filters/            Filter sidebar (desktop), filter drawer (mobile), checkbox groups
    assets/             Result card, grid, preview, match score, favorite button, sort/results header
    states/             Loading, empty, and error state components
  domain/asset/         Normalized AssetSearchResult model, AssetSearchQuery, AssetSearchProvider contract
  data/                 Mock dataset (MOCK_ASSETS)
  lib/search/           Pure filter/sort functions + the mock AssetSearchProvider implementation
  lib/storage.ts        SSR-safe localStorage helpers
  lib/format.ts         Display formatting helpers (pricing, etc.)
  hooks/                useAssetSearch, useFavorites
```

Key rules this codebase follows (see `AGENTS.md` for the enforceable version):

- **UI components never see provider-specific shapes.** Every source is normalized into
  `AssetSearchResult` (`src/domain/asset/types.ts`) before it reaches a component.
- **Search/filter/sort logic is pure** (`src/lib/search/filter.ts`, `sort.ts`) and unit tested in
  isolation from React and from the mock dataset's exact contents.
- **`AssetSearchProvider` / `AssetSearchQuery`** (`src/domain/asset/provider.ts`, `query.ts`) are the
  seam a real integration (Sketchfab, Fab, Unity Asset Store, etc.) will implement later — the mock
  provider (`src/lib/search/mock-provider.ts`) is just one implementation of that interface.
- **Server components by default.** Only components that need state, effects, or browser APIs
  (search, filters, favorites, mobile nav) are marked `"use client"`.
- **Favorites persist to `localStorage`**, guarded for SSR via `lib/storage.ts` and read through
  `useSyncExternalStore` (`hooks/useFavorites.ts`) so the server-rendered and first client-rendered
  output always agree.
- **No remote images.** Previews are CSS/gradient placeholders driven by asset style + type, so no
  `next/image` remote-pattern configuration is required.

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other commands:

```bash
npm run lint     # ESLint (eslint-config-next)
npm run test     # Vitest — unit tests for filtering, sorting, and favorites persistence
npm run build    # Production build (Turbopack)
npm run start    # Serve the production build
```

## Planned upcoming integrations

- Live provider implementations of `AssetSearchProvider` for Sketchfab, Poly Haven, Fab, itch.io,
  Unity Asset Store, and OpenGameArt.
- A real AI-assisted matching/ranking service to replace the placeholder match scores and "why it
  fits" text.
- A persisted Project Profile (engine, render pipeline, target platform) that search and ranking
  can use as context, backed by real storage instead of a placeholder header button.
- Pagination or infinite scroll once result sets are no longer a small fixed mock list.

## Known limitations (Milestone 1)

- All twelve results are static, hand-written demo entries; nothing is fetched from a network.
- Match scores and "why it fits" text are placeholders, not model output.
- "View original" links go to source homepages, not real per-asset listing pages.
- The Project Profile button is not yet wired to any state.
