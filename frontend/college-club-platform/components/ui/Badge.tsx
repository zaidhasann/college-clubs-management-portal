import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info";
  className?: string;
}

export default function Badge({
  children,
  variant = "info",
  className = "",
}: BadgeProps) {
  const variantStyles = {
    success: "bg-green-900/30 text-green-400 border border-green-700",
    warning: "bg-yellow-900/30 text-yellow-400 border border-yellow-700",
    danger: "bg-red-900/30 text-red-400 border border-red-700",
    info: "bg-blue-900/30 text-blue-400 border border-blue-700",
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
