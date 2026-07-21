import { SearchHero } from "@/components/search/SearchHero";
import { ExploreExperience } from "@/components/search/ExploreExperience";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SearchHero />
      <ExploreExperience />
    </div>
  );
}
