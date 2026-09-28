import { useState } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";

interface ImageGeneratorProps {
  onGenerated: (url: string, prompt: string) => void;
}

export default function ImageGenerator({ onGenerated }: ImageGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = () => {
    if (!prompt.trim()) return;
    setLoading(true);
    const encoded = encodeURIComponent(prompt.trim());
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}`;
    // Simulate brief delay to show loading state
    setTimeout(() => {
      onGenerated(url, prompt.trim());
      setPrompt("");
      setOpen(false);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
        title="Generate image"
      >
        <ImageIcon className="w-4 h-4" />
      </motion.button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute bottom-full mb-3 left-0 w-80 glass-strong rounded-2xl p-4 z-50"
        >
          <h3 className="text-sm font-semibold mb-3 text-white">
            🎨 Generate Image
          </h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="a purple dragon on a mountain, digital art"
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                generate();
              }
            }}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={generate}
              disabled={!prompt.trim() || loading}
              className="btn-glow flex-1 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Powered by Pollinations.ai (free, no signup)
          </p>
        </motion.div>
      )}
    </div>
  );
}