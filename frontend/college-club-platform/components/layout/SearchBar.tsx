"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clubsAPI, eventsAPI } from "@/lib/api";

interface SearchResult {
  id: string;
  title: string;
  type: "club" | "event";
  subtitle: string;
  extra?: string;
}

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [clubs, events] = await Promise.all([
          clubsAPI.getAll(),
          eventsAPI.getAll(),
        ]);

        const q = query.toLowerCase();

        const clubResults: SearchResult[] = clubs
          .filter(
            (c: any) =>
              c.name?.toLowerCase().includes(q) ||
              c.description?.toLowerCase().includes(q)
          )
          .map((c: any) => ({
            id: c._id,
            title: c.name,
            type: "club" as const,
            subtitle: `${c.members?.length || 0} members`,
            extra: c.description?.slice(0, 60) || "",
          }));

        const eventResults: SearchResult[] = events
          .filter(
            (e: any) =>
              e.title?.toLowerCase().includes(q) ||
              e.description?.toLowerCase().includes(q)
          )
          .map((e: any) => ({
            id: e._id,
            title: e.title,
            type: "event" as const,
            subtitle: new Date(e.date).toLocaleDateString(),
            extra: e.isPaid ? `₹${e.price}` : "Free",
          }));

        setResults([...clubResults, ...eventResults].slice(0, 8));
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setQuery("");
    setIsOpen(false);

    if (result.type === "club") {
      router.push("/dashboard/member/clubs");
    } else {
      router.push("/dashboard/member/events");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clubResults = results.filter((r) => r.type === "club");
  const eventResults = results.filter((r) => r.type === "event");

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md">
      {/* Search Input */}
      <div className={`relative group transition-all duration-300 ${focused ? "scale-[1.02]" : ""}`}>
        {/* Glow effect */}
        <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500/40 to-purple-500/40 blur-sm transition-opacity duration-300 ${focused ? "opacity-100" : "opacity-0"}`} />

        <div className="relative">
          <svg
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 pointer-events-none ${focused ? "text-blue-400" : "text-zinc-500"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setFocused(true);
              if (results.length > 0) setIsOpen(true);
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Search clubs & events..."
            className="w-full pl-10 pr-16 py-2 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/60 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 focus:bg-zinc-800 transition-all duration-300"
          />

          {/* Search icon or spinner */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {loading ? (
              <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            ) : !query ? (
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            ) : (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setIsOpen(false);
                  inputRef.current?.focus();
                }}
                className="text-zinc-500 hover:text-white transition p-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl shadow-2xl shadow-black/40 z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {results.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-zinc-400 text-sm">No results for &quot;{query}&quot;</p>
              <p className="text-zinc-600 text-xs mt-1">Try a different keyword</p>
            </div>
          ) : (
            <div className="p-2">
              {/* Clubs Section */}
              {clubResults.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Clubs
                  </div>
                  {clubResults.map((result, index) => {
                    const globalIndex = results.indexOf(result);
                    return (
                      <button
                        key={`club-${result.id}`}
                        onClick={() => handleSelect(result)}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-3 rounded-lg transition-all duration-150 text-sm group ${
                          globalIndex === selectedIndex
                            ? "bg-blue-500/15 border border-blue-500/30"
                            : "border border-transparent hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                          globalIndex === selectedIndex ? "bg-blue-500/20" : "bg-zinc-800 group-hover:bg-zinc-700"
                        }`}>
                          <span className="text-base">🏢</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{result.title}</div>
                          <div className="text-xs text-zinc-500 truncate">{result.subtitle}{result.extra ? ` · ${result.extra}` : ""}</div>
                        </div>
                        <svg className={`w-4 h-4 flex-shrink-0 transition-all ${globalIndex === selectedIndex ? "text-blue-400 translate-x-0" : "text-zinc-600 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Divider */}
              {clubResults.length > 0 && eventResults.length > 0 && (
                <div className="my-1.5 border-t border-zinc-800/80" />
              )}

              {/* Events Section */}
              {eventResults.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Events
                  </div>
                  {eventResults.map((result) => {
                    const globalIndex = results.indexOf(result);
                    return (
                      <button
                        key={`event-${result.id}`}
                        onClick={() => handleSelect(result)}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-3 rounded-lg transition-all duration-150 text-sm group ${
                          globalIndex === selectedIndex
                            ? "bg-blue-500/15 border border-blue-500/30"
                            : "border border-transparent hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                          globalIndex === selectedIndex ? "bg-purple-500/20" : "bg-zinc-800 group-hover:bg-zinc-700"
                        }`}>
                          <span className="text-base">📅</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{result.title}</div>
                          <div className="text-xs text-zinc-500 truncate">{result.subtitle}{result.extra ? ` · ${result.extra}` : ""}</div>
                        </div>
                        <svg className={`w-4 h-4 flex-shrink-0 transition-all ${globalIndex === selectedIndex ? "text-blue-400 translate-x-0" : "text-zinc-600 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="mt-1 pt-2 border-t border-zinc-800/80 px-3 pb-1">
                <p className="text-[10px] text-zinc-600 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500 text-[9px]">↑↓</kbd> navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500 text-[9px]">↵</kbd> select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500 text-[9px]">esc</kbd> close
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
