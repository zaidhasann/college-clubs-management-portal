interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
}: StatCardProps) {
  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 group">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-zinc-400 font-medium">{title}</p>
        {icon && <span className="text-2xl opacity-30 group-hover:opacity-50 transition">{icon}</span>}
      </div>
      <h2 className="text-4xl font-bold mt-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">{value}</h2>
      {subtitle && (
        <p className="text-xs text-zinc-500 mt-3">{subtitle}</p>
      )}
    </div>
  );
}