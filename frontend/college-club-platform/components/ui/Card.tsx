import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export default function Card({ children, className = "", interactive = false }: CardProps) {
  return (
    <div
      className={`bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-lg transition-transform duration-300 will-change-transform ${
        interactive
          ? "hover:scale-[1.02] hover:translate-y-[-6px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] cursor-pointer"
          : "hover:shadow-xl"
      } ${className}`}
    >
      {children}
    </div>
  );
}

