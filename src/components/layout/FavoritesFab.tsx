"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

/**
 * Floating quick-access shortcut to /favorites — the top nav already links
 * there, but on mobile that's behind the hamburger menu (two taps). This
 * stays reachable from anywhere with one tap, and is hidden on the
 * Favorites page itself (nothing to jump to from there).
 */
export function FavoritesFab() {
  const pathname = usePathname();
  const { favoriteIds } = useFavorites();

  if (pathname === "/favorites") return null;

  return (
    <Link
      href="/favorites"
      aria-label={`View favorites (${favoriteIds.length} saved)`}
      className="focus-ring glow-accent fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent-blue text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-500"
    >
      <Heart size={22} aria-hidden="true" />
      {favoriteIds.length > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-red-500 px-1 text-[11px] font-semibold text-white"
        >
          {favoriteIds.length > 99 ? "99+" : favoriteIds.length}
        </span>
      )}
    </Link>
  );
}
