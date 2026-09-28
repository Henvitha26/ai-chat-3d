import * as CountUpModule from "react-countup";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

// Normalize the import shape (handles default, named, nested default)
const CountUp: any =
  (CountUpModule as any)?.default?.default ??
  (CountUpModule as any)?.default ??
  (CountUpModule as any)?.CountUp;

interface KpiCardProps {
  title: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function KpiCard({
  title,
  value,
  change,
  icon: Icon,
  prefix = "",
  suffix = "",
  decimals = 0,
}: KpiCardProps) {
  const positive = (change ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-strong rounded-2xl p-5 relative overflow-hidden group"
    >
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-violet-500/30 to-pink-500/30 blur-3xl group-hover:scale-150 transition-transform duration-700" />

      <div className="relative">
        <div className="flex justify-between items-start mb-3">
          <span className="text-sm text-gray-400 font-medium">{title}</span>
          <div className="p-2 rounded-lg bg-white/5">
            <Icon className="w-4 h-4 text-violet-400" />
          </div>
        </div>

        <div className="text-3xl font-bold text-white mb-2">
          {prefix}
          {typeof CountUp === "function" ? (
            <CountUp
              end={value}
              duration={1.5}
              separator=","
              decimals={decimals}
            />
          ) : (
            <span>{value.toLocaleString()}</span>
          )}
          {suffix}
        </div>

        {change !== undefined && (
          <div
            className={`text-xs font-medium flex items-center gap-1 ${
              positive ? "text-green-400" : "text-red-400"
            }`}
          >
            {positive ? "↑" : "↓"} {Math.abs(change)}% vs last week
          </div>
        )}
      </div>
    </motion.div>
  );
}