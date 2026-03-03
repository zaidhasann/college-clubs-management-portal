import React from "react";
import Button from "./Button";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaText?: string;
  ctaAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  ctaText,
  ctaAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-6">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-center max-w-sm mb-8">{description}</p>
      {ctaText && ctaAction && (
        <Button onClick={ctaAction} variant="primary">
          {ctaText}
        </Button>
      )}
    </div>
  );
}
