import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAdminTheme } from "@/context/AdminThemeContext";

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "amber" | "green" | "blue" | "purple";
}

const COLORS = {
  amber: {
    bg: "from-amber-500/20 to-amber-600/5",
    icon: "bg-amber-500/20 text-amber-400",
    value: "text-amber-400",
    border: "border-amber-500/20",
  },
  green: {
    bg: "from-emerald-500/20 to-emerald-600/5",
    icon: "bg-emerald-500/20 text-emerald-400",
    value: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  blue: {
    bg: "from-blue-500/20 to-blue-600/5",
    icon: "bg-blue-500/20 text-blue-400",
    value: "text-blue-400",
    border: "border-blue-500/20",
  },
  purple: {
    bg: "from-purple-500/20 to-purple-600/5",
    icon: "bg-purple-500/20 text-purple-400",
    value: "text-purple-400",
    border: "border-purple-500/20",
  },
};

export default function AdminStatCard({
  label,
  value,
  icon: Icon,
  trend = "neutral",
  trendValue,
  color = "amber",
}: AdminStatCardProps) {
  const { isDark } = useAdminTheme();
  const c = COLORS[color];

  const cardBg = isDark
    ? `bg-gradient-to-br ${c.bg} border ${c.border} backdrop-blur-sm`
    : `bg-beige-50 border border-beige-300 shadow-sm`;
  const labelColor = isDark ? "text-stone-400" : "text-beige-600 font-medium";
  const valueColor = isDark ? c.value : "text-beige-900";

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
      ? "text-red-400"
      : isDark
      ? "text-stone-500"
      : "text-stone-400";

  return (
    <div className={`rounded-2xl p-5 transition-all hover:scale-[1.02] ${cardBg}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold mb-1 ${valueColor}`}>{value}</p>
      <p className={`text-xs font-medium uppercase tracking-wider ${labelColor}`}>{label}</p>
    </div>
  );
}
