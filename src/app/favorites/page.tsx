import type { Metadata } from "next";
import { FavoritesExperience } from "@/components/search/FavoritesExperience";

export const metadata: Metadata = {
  title: "Favorites — AssetScout AI",
};

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your Favorites</h1>
      <p className="mt-2 text-sm text-text-muted">Assets you&apos;ve saved for this project, stored locally in your browser.</p>
      <div className="mt-8">
        <FavoritesExperience />
      </div>
    </div>
  );
}
