import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export default function Card({ children, className = "", interactive = false }: CardProps) {
  return (
    <div
      className={`bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-lg transition-all duration-300 ${
        interactive
          ? "hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 cursor-pointer"
          : "hover:border-zinc-700 hover:shadow-xl"
      } ${className}`}
    >
      {children}
    </div>
  );
}

