"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, User, X } from "lucide-react";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "/", label: "Explore" },
  { href: "/favorites", label: "Favorites" },
  { href: "/sources", label: "Sources" },
] as const;

function NavLink({ href, label, onNavigate }: { href: string; label: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`focus-ring rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-surface-elevated text-foreground"
          : "text-text-muted hover:bg-surface-elevated hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring rounded-md" aria-label="AssetScout AI home">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        <div className="hidden items-center md:flex">
          <button
            type="button"
            className="focus-ring flex items-center gap-2 rounded-md border border-border-strong bg-surface-elevated px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            <User size={16} className="text-accent-cyan" aria-hidden="true" />
            Project Profile
          </button>
        </div>

        <button
          type="button"
          className="focus-ring inline-flex items-center justify-center rounded-md border border-border-strong p-2 text-foreground md:hidden"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="border-t border-border-subtle bg-surface px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                onNavigate={() => setIsMobileMenuOpen(false)}
              />
            ))}
            <button
              type="button"
              className="focus-ring mt-1 flex items-center gap-2 rounded-md border border-border-strong bg-surface-elevated px-3.5 py-2 text-left text-sm font-medium text-foreground"
            >
              <User size={16} className="text-accent-cyan" aria-hidden="true" />
              Project Profile
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
