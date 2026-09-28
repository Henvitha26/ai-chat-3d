import { motion } from "framer-motion";

interface Props {
  role: "user" | "assistant";
  username?: string;
}

export default function MessageAvatar({ role, username }: Props) {
  // ---- User avatar ----
  if (role === "user") {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-1 shadow-lg">
        {username?.[0]?.toUpperCase() || "U"}
      </div>
    );
  }

  // ---- AI avatar (animated mini orb) ----
  return (
    <div className="w-8 h-8 rounded-full glass-strong flex items-center justify-center flex-shrink-0 relative overflow-hidden mt-1">
      {/* Pulsing gradient orb */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 via-blue-400 to-pink-400"
      />
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full border border-violet-400/30" />
    </div>
  );
}