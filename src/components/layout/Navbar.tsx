"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shuffle, Home, Search, PlusCircle, Settings, Library } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Meine Playlists", icon: Home },
  { href: "/search", label: "Suchen", icon: Search },
  { href: "/import", label: "Bibliothek", icon: Library },
  { href: "/playlist/new", label: "Neue Playlist", icon: PlusCircle },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-bg-primary/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center glow-sm group-hover:glow transition-all">
            <Shuffle className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight gradient-text">
            Shuffle
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                pathname.startsWith(href)
                  ? "bg-accent/20 text-accent"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile Nav */}
        <nav className="flex md:hidden items-center gap-1">
          {navItems.slice(0, 3).map(({ href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200",
                pathname.startsWith(href)
                  ? "bg-accent/20 text-accent"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-5 h-5" />
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
