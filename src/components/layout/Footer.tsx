import Link from "next/link";

export function Footer() {
  const feedbackUrl =
    "https://github.com/Eliozk/asset-scout-ai/issues/new?title=Feedback%3A%20&body=What%20did%20you%20try%3F%0A%0AWhat%20worked%20well%3F%0A%0AWhat%20could%20be%20improved%3F%0A";

  return (
    <footer className="border-t border-border-subtle bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-text-faint sm:px-6 lg:px-8">
        <p>
          AssetScout AI searches Poly Haven, Sketchfab, and Pixabay live via their official APIs, plus
          an authorized indexed catalog from Kenney — and links out to more marketplaces you can search
          or browse yourself. Local, on-device semantic ranking powers &quot;AI Match&quot;; keyword
          relevance is the honest deterministic fallback everywhere else.{" "}
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
