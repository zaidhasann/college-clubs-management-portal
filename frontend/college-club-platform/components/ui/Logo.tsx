import Image from "next/image";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
}

export default function Logo({
  variant = "full",
  className = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
        <Image
          src="/logo.png"
          alt="Club Platform"
          width={40}
          height={40}
          className="w-10 h-10"
          priority
        />
      </div>
      {variant === "full" && (
        <div>
          <h1 className="text-xl font-bold text-white">Club Platform</h1>
          <p className="text-xs text-zinc-400">Community & Events</p>
        </div>
      )}
    </div>
  );
}
