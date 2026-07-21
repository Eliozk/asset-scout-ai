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
- **No remote image URLs.** Previews are CSS/gradient placeholders (`components/assets/AssetPreview.tsx`
  + `asset-visuals.ts`). If real thumbnails are introduced later, they need an explicit
  `next.config.ts` `images.remotePatterns` entry and review — don't add remote `<img>`/`next/image`
  sources without that.
- **`localStorage` access must stay SSR-safe.** Go through `src/lib/storage.ts` or
  `useSyncExternalStore` (see `hooks/useFavorites.ts`) — never read/write `localStorage` directly
  in a component or during render.
- **No state-management library and no `any`.** Local component state + the two hooks
  (`useAssetSearch`, `useFavorites`) are sufficient for this app's scope.

## Required verification commands

Run all three before considering a change to `src/` complete, and fix everything they report:

```bash
npm run lint
npm run test
npm run build
```
