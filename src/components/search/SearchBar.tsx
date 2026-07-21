"use client";

import { Sparkles } from "lucide-react";

interface SearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <form
      role="search"
      aria-label="AI-powered asset search"
      className="mx-auto mt-8 flex w-full max-w-3xl flex-col gap-3 sm:flex-row"
      onSubmit={(event) => event.preventDefault()}
    >
      <label htmlFor="asset-search-input" className="sr-only">
        Describe the asset you need
      </label>
      <div className="relative flex-1">
        <Sparkles
          size={20}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-accent-cyan"
        />
        <input
          id="asset-search-input"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="A colorful low-poly fantasy dragon, rigged and animated for Unity URP mobile"
          className="focus-ring w-full rounded-lg border border-border-strong bg-surface-elevated py-3.5 pl-12 pr-4 text-sm text-foreground placeholder:text-text-faint sm:text-base"
        />
      </div>
      <button
        type="submit"
        title="AI-powered asset search"
        className="glow-accent focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-accent-blue px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 sm:text-base"
      >
        <Sparkles size={18} aria-hidden="true" />
        AI Search
      </button>
    </form>
  );
}
