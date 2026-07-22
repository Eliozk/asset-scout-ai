"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Logged client-side only, to the browser console — never sent anywhere,
    // and Next.js already strips the message down to a generic one plus a
    // `digest` id in production builds, so no internal detail leaks here.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-24 text-center sm:px-6 lg:px-8">
      <AlertTriangle size={32} className="text-red-400" aria-hidden="true" />
      <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-sm text-text-muted">
        An unexpected error occurred. Try again, or head back to search.
      </p>
      <button
        type="button"
        onClick={reset}
        className="focus-ring mt-2 inline-flex items-center rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
      >
        Try again
      </button>
    </div>
  );
}
