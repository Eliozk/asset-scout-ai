<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AssetScout AI — architecture rules

These rules govern the app under `src/`. See `README.md` for the fuller product/architecture
overview; this section is the enforceable summary.

- **Never leak provider-specific shapes into components.** All search results must be the
  normalized `AssetSearchResult` type (`src/domain/asset/types.ts`). If you add a new source or
  field, normalize it in the domain layer first.
- **Keep filter/sort/ranking logic pure.** It lives in `src/lib/search/` and must not import React,
  touch `window`/`localStorage`, or depend on component state. Add unit tests
  (`src/lib/search/*.test.ts`) alongside any change to this logic.
- **Respect the provider contract.** `AssetSearchProvider` / `AssetSearchQuery`
  (`src/domain/asset/provider.ts`, `query.ts`) are the seam for future live integrations. The mock
  provider (`src/lib/search/mock-provider.ts`) must stay a drop-in implementation of that same
  interface — don't special-case mock behavior in the hooks or components that call it.
- **Server components by default.** Add `"use client"` only to components that need state,
  effects, or a browser API. Don't push the directive higher up the tree than necessary.
- **Remote images stay narrowly scoped.** Only `cdn.polyhaven.com` is allowed in
  `next.config.ts` `images.remotePatterns`. Adding another remote host needs the same explicit
  review. `AssetPreview.tsx` always keeps the CSS/gradient placeholder as a fallback for missing or
  failed thumbnails — never assume a remote image will load.
- **External providers are called server-side only.** A live provider (e.g. Poly Haven) is fetched
  exclusively from its own Route Handler under `src/app/api/providers/<name>/route.ts`
  (`src/lib/providers/<name>/fetch-assets.ts` holds the actual `fetch()` call, required headers,
  timeout, and caching). Client code — including the matching `AssetSearchProvider` in
  `src/lib/providers/<name>/provider.ts` — only ever calls our own route, never the third-party API
  directly. Treat every external response as untrusted: validate with manual type guards
  (`raw-types.ts`) and skip malformed entries instead of throwing.
- **`localStorage` access must stay SSR-safe.** Go through `src/lib/storage.ts` or
  `useSyncExternalStore` (see `hooks/useFavorites.ts`) — never read/write `localStorage` directly
  in a component or during render.
- **No state-management library and no `any`.** Local component state + the two hooks
  (`useAssetSearch`, `useFavorites`) are sufficient for this app's scope.
- **Don't invent compatibility data.** Only set `formats`/engine-specific claims when the source
  actually provides them (see `AssetSearchResult.formats` being optional for exactly this reason).
- **Live relevance is not AI.** `matchScore`/`whyItFits` for live providers come from
  `src/lib/search/relevance.ts`, a deterministic tag/text/category scorer — label it "relevance" in
  the UI, never as an AI judgment.

## Required verification commands

Run all three before considering a change to `src/` complete, and fix everything they report:

```bash
npm run lint
npm run test
npm run build
```
