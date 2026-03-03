import React from "react";

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  helperText?: string;
}

export default function Input({
  label,
  error,
  icon,
  iconPosition = "left",
  helperText,
  className = "",
  disabled = false,
  ...props
}: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-lg pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={`w-full ${icon && iconPosition === "left" ? "pl-10" : "px-4"} ${icon && iconPosition === "right" ? "pr-10" : "px-4"} py-3 bg-zinc-800 border ${error ? "border-red-500" : "border-zinc-700"} rounded-lg text-white placeholder-zinc-500 focus:outline-none ${error ? "focus:border-red-400 focus:ring-1 focus:ring-red-400/50" : "focus:border-blue-500 focus:ring-1 focus:ring-blue-500"} transition ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-zinc-600"} ${className}`}
          disabled={disabled}
          {...props}
        />
        {icon && iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-lg pointer-events-none">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-red-400">⚠</span>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {helperText && !error && (
        <p className="text-xs text-zinc-400">{helperText}</p>
      )}
    </div>
  );
}
