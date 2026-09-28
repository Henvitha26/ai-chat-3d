import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../store/theme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      title="Toggle theme"
      className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-violet-400" />
        ) : (
          <Sun className="w-4 h-4 text-yellow-500" />
        )}
      </motion.div>
    </button>
  );
}