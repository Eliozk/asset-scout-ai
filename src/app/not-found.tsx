import Link from "next/link";
import type { Metadata } from "next";
import { Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-24 text-center sm:px-6 lg:px-8">
      <Compass size={32} className="text-text-faint" aria-hidden="true" />
      <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
      <p className="max-w-md text-sm text-text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="focus-ring mt-2 inline-flex items-center rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
      >
        Back to search
      </Link>
    </div>
  );
}
