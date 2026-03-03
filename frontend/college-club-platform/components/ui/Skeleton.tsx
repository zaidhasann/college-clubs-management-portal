import React from "react";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-2xl p-8 animate-pulse ${className}`}
      style={{
        backgroundSize: "200% 100%",
        animation: "shimmer 2s infinite",
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="space-y-4">
        <div className="h-4 bg-zinc-600 rounded w-1/3"></div>
        <div className="h-8 bg-zinc-600 rounded w-1/2"></div>
        <div className="h-3 bg-zinc-600 rounded w-2/3"></div>
      </div>
    </div>
  );
}

export function SkeletonTable({ count = 4 }: SkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-zinc-900 rounded-lg p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="h-4 bg-zinc-700 rounded flex-1"></div>
            <div className="h-4 bg-zinc-700 rounded flex-1"></div>
            <div className="h-4 bg-zinc-700 rounded flex-1"></div>
            <div className="h-4 bg-zinc-700 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonEventCard({ count = 3 }: SkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-2xl overflow-hidden animate-pulse"
        >
          <div className="h-40 bg-zinc-700"></div>
          <div className="p-4 space-y-3">
            <div className="h-5 bg-zinc-700 rounded w-2/3"></div>
            <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
            <div className="h-8 bg-zinc-700 rounded mt-4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-2xl p-6 animate-pulse"
        >
          <div className="h-4 bg-zinc-700 rounded w-1/2 mb-3"></div>
          <div className="h-10 bg-zinc-700 rounded w-2/3 mb-3"></div>
          <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export default SkeletonCard;
