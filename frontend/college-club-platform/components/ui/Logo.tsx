import React from "react";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
}

export default function Logo({ variant = "full", className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#ef4444] flex items-center justify-center text-white font-bold">
        CM
      </div>
      {variant === "full" && (
        <div className="leading-tight">
          <h1 className="text-lg font-extrabold">Club<span className="text-[#ef4444] tracking-wider" style={{ letterSpacing: '0.18em' }}>मंच</span></h1>
          <p className="text-xs muted">All Your Clubs. One Platform.</p>
        </div>
      )}
    </div>
  );
}
