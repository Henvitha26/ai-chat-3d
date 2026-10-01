import { motion } from "framer-motion";

const SUGGESTIONS = [
  { icon: "🍳", text: "Recipe ideas for dinner" },
  { icon: "💡", text: "Startup ideas for 2026" },
  { icon: "🐍", text: "Debug my Python code" },
  { icon: "📚", text: "Explain quantum computing simply" },
  { icon: "✍️", text: "Write a professional email" },
  { icon: "🎨", text: "Create a short story" },
];

interface Props {
  onSelect: (text: string) => void;
}

export default function PromptChips({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-2xl mx-auto mt-4 sm:mt-8 px-2">
      {SUGGESTIONS.map((s, i) => (
        <motion.button
          key={s.text}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(s.text)}
          className="glass rounded-xl p-2 sm:p-3 text-left text-xs sm:text-sm text-gray-200 hover:bg-white/10 transition flex items-center gap-2 border border-white/10"
        >
          <span className="text-lg sm:text-2xl flex-shrink-0">{s.icon}</span>
          <span className="truncate leading-tight">{s.text}</span>
        </motion.button>
      ))}
    </div>
  );
}