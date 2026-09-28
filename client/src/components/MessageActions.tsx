import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, RefreshCw, Volume2 } from "lucide-react";

interface MessageActionsProps {
  content: string;
  onRegenerate?: () => void;
  onSpeak: () => void;
}

export default function MessageActions({
  content,
  onRegenerate,
  onSpeak,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-1 mt-2"
    >
      <ActionButton
        icon={copied ? Check : Copy}
        label={copied ? "Copied" : "Copy"}
        onClick={handleCopy}
        active={copied}
      />
      {onRegenerate && (
        <ActionButton icon={RefreshCw} label="Regenerate" onClick={onRegenerate} />
      )}
      <ActionButton icon={Volume2} label="Speak" onClick={onSpeak} />
    </motion.div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`group flex items-center gap-1 px-2 py-1 rounded-md text-xs transition ${
        active
          ? "bg-green-500/20 text-green-300"
          : "text-gray-400 hover:text-white hover:bg-white/10"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="opacity-0 group-hover:opacity-100 transition">
        {label}
      </span>
    </button>
  );
}