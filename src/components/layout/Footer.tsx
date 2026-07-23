import Link from "next/link";
import { AUTHORIZED_INDEXED_CATALOG_SOURCES, LIVE_API_SOURCES } from "@/lib/sources/integrated-sources";

export function Footer() {
  const feedbackUrl =
    "https://github.com/Eliozk/asset-scout-ai/issues/new?title=Feedback%3A%20&body=What%20did%20you%20try%3F%0A%0AWhat%20worked%20well%3F%0A%0AWhat%20could%20be%20improved%3F%0A";
  const liveCount = LIVE_API_SOURCES.length;
  const catalogCount = AUTHORIZED_INDEXED_CATALOG_SOURCES.length;

  return (
    <footer className="border-t border-border-subtle bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-text-faint sm:px-6 lg:px-8">
        <p>
          AssetScout AI searches {liveCount} sources live via their official APIs, plus {catalogCount}{" "}
          authorized indexed catalog — and links out to more marketplaces you can search or browse
          yourself. An optional Gemini step can translate a natural-language request (English or
          Hebrew) before searching; local, on-device semantic ranking powers &quot;AI Match&quot;;
          keyword relevance is the honest deterministic fallback everywhere else.{" "}
          <Link href="/sources" className="focus-ring rounded font-medium text-text-muted underline hover:text-foreground">
            See every source and what each connection means
          </Link>
          .
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <a
            href={feedbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring rounded font-medium text-accent-cyan underline hover:text-foreground"
          >
            Send feedback
          </a>
          <Link href="/legal" className="focus-ring rounded font-medium text-text-muted underline hover:text-foreground">
            Privacy &amp; Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
