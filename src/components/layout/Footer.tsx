import Link from "next/link";

export function Footer() {
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
      </div>
    </footer>
  );
}
