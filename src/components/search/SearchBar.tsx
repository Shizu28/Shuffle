"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchTab } from "@/types";

interface SearchBarProps {
  onSearch: (query: string, tab: SearchTab) => void;
  isLoading?: boolean;
  className?: string;
}

const tabs: { value: SearchTab; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "tv", label: "Serien" },
  { value: "movie", label: "Filme" },
];

export function SearchBar({ onSearch, isLoading, className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim().length >= 2) {
          onSearch(value.trim(), activeTab);
        }
      }, 400);
    },
    [activeTab, onSearch]
  );

  const handleTabChange = useCallback(
    (tab: SearchTab) => {
      setActiveTab(tab);
      if (query.trim().length >= 2) {
        onSearch(query.trim(), tab);
      }
    },
    [query, onSearch]
  );

  const clearSearch = () => {
    setQuery("");
    onSearch("", activeTab);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Serien oder Filme suchen..."
          className="input pl-12 pr-12 text-base h-14"
          autoFocus
        />
        {isLoading ? (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent animate-spin" />
        ) : query ? (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 hover:text-white transition-colors"
          >
            <X />
          </button>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleTabChange(value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              activeTab === value
                ? "bg-accent text-white"
                : "bg-white/10 text-white/60 hover:bg-white/15 hover:text-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
