import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { AUTHORIZED_INDEXED_CATALOG_SOURCES, LIVE_API_SOURCES } from "@/lib/sources/integrated-sources";
import { EXTERNAL_MARKETPLACES } from "@/lib/marketplaces/registry";

export const metadata: Metadata = {
  title: "Sources",
  description: "Every data source AssetScout connects to or links out to, and exactly what that connection means.",
  alternates: { canonical: "/sources" },
};

function SourceCard({
  name,
  homepageUrl,
  assetTypes,
  connectionModeLabel,
  resultsAppearNote,
  attributionOrLimitationLabel,
  attributionOrLimitationText,
  limitation,
}: {
  readonly name: string;
  readonly homepageUrl: string;
  readonly assetTypes: readonly string[];
  readonly connectionModeLabel: string;
  readonly resultsAppearNote: string;
  readonly attributionOrLimitationLabel: string;
  readonly attributionOrLimitationText: string;
  readonly limitation: string;
}) {
  return (
    <article className="rounded-xl border border-border-subtle bg-surface-elevated p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{name}</h3>
        <a
          href={homepageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center gap-1 rounded text-xs font-medium text-accent-cyan hover:underline"
          aria-label={`${name} official site (opens in a new tab)`}
        >
          Official site
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>

      <dl className="mt-3 grid gap-2 text-xs">
        <div>
          <dt className="text-text-faint">Asset types</dt>
          <dd className="text-text-muted">{assetTypes.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-text-faint">Connection</dt>
          <dd className="text-text-muted">{connectionModeLabel}</dd>
        </div>
        <div>
          <dt className="text-text-faint">Results appear in AssetScout?</dt>
          <dd className="text-text-muted">{resultsAppearNote}</dd>
        </div>
        <div>
          <dt className="text-text-faint">{attributionOrLimitationLabel}</dt>
          <dd className="text-text-muted">{attributionOrLimitationText}</dd>
        </div>
        <div>
          <dt className="text-text-faint">Known limitation</dt>
          <dd className="text-text-muted">{limitation}</dd>
        </div>
      </dl>
    </article>
  );
}

export default function SourcesPage() {
  // Derived from the registry, never hard-coded — a marketplace only counts
  // toward searchCapableCount because its own `mode` says "outbound-search",
  // which registry.ts only ever sets after directly verifying the generated
  // URL preserves the query (see registry.ts's module doc comment).
  const searchCapableCount = EXTERNAL_MARKETPLACES.filter((m) => m.mode === "outbound-search").length;
  const browseOnlyCount = EXTERNAL_MARKETPLACES.length - searchCapableCount;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sources</h1>
      <p className="mt-2 max-w-3xl text-sm text-text-muted">
        Every data source AssetScout connects to or links out to, grouped by exactly what kind of
        connection it is. This page exists so nothing here is ever ambiguous about what was actually
        searched versus what was just linked to.
      </p>

      <div className="mt-6 grid gap-4 rounded-xl border border-border-subtle bg-surface p-5 text-sm text-text-muted sm:grid-cols-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Verified API result</h2>
          <p className="mt-1">
            AssetScout queried the source&apos;s own official API for your exact search and normalized the
            real response into a result card — never invented or guessed.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">
            Authorized Indexed Catalog
          </h2>
          <p className="mt-1">
            A static, versioned snapshot generated ahead of time from the source&apos;s own official feed —
            not fetched live per search, and not necessarily the source&apos;s complete catalog.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">External marketplace</h2>
          <p className="mt-1">
            AssetScout only generates a link to the marketplace&apos;s own site — it never searches,
            retrieves, or verifies anything there. Always check price, license, download availability,
            and engine compatibility on the marketplace itself.
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Live API integrations</h2>
        <p className="mt-1 text-sm text-text-muted">Queried live, per search, through AssetScout&apos;s own server.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LIVE_API_SOURCES.map((source) => (
            <SourceCard
              key={source.id}
              name={source.name}
              homepageUrl={source.homepageUrl}
              assetTypes={source.assetTypes}
              connectionModeLabel="Live API — queried per search"
              resultsAppearNote="Yes — Verified API result"
              attributionOrLimitationLabel="Attribution / license"
              attributionOrLimitationText={source.attributionNote}
              limitation={source.limitation}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Authorized indexed catalog</h2>
        <p className="mt-1 text-sm text-text-muted">
          A versioned static snapshot regenerated periodically from the source&apos;s own official feed.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUTHORIZED_INDEXED_CATALOG_SOURCES.map((source) => (
            <SourceCard
              key={source.id}
              name={source.name}
              homepageUrl={source.homepageUrl}
              assetTypes={source.assetTypes}
              connectionModeLabel="Authorized Indexed Catalog — static snapshot"
              resultsAppearNote="Yes — Authorized Indexed Catalog"
              attributionOrLimitationLabel="Attribution / license"
              attributionOrLimitationText={source.attributionNote}
              limitation={source.limitation}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">External marketplace links</h2>
        <p className="mt-1 text-sm text-text-muted">
          Outbound links only. AssetScout does not search, scrape, or verify anything from these sites — see
          the Explore page&apos;s &quot;Search more asset marketplaces&quot; section.{" "}
          {/* Always computed from the registry, never typed as a literal — a marketplace only ever
              counts as "search" here because EXTERNAL_MARKETPLACES.mode says so, which itself only
              gets set to "outbound-search" when the generated URL was verified to preserve the query. */}
          {searchCapableCount} of {EXTERNAL_MARKETPLACES.length} support a real search link ({browseOnlyCount} open
          to browse only, since a working search URL couldn&apos;t be verified for those).
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXTERNAL_MARKETPLACES.map((marketplace) => (
            <SourceCard
              key={marketplace.id}
              name={marketplace.name}
              homepageUrl={marketplace.homepageUrl}
              assetTypes={marketplace.specialties}
              connectionModeLabel={
                marketplace.mode === "outbound-search"
                  ? "External marketplace — opens a real search"
                  : "External marketplace — opens to browse"
              }
              resultsAppearNote="No — this is an outbound link, not an integrated result"
              attributionOrLimitationLabel="Query support"
              attributionOrLimitationText={
                marketplace.supportsQuery
                  ? "Reuses your current AssetScout search text as a search query."
                  : "Always opens the homepage — does not accept a search query."
              }
              limitation={marketplace.limitation}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
