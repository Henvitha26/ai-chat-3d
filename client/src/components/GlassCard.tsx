import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({
  children,
  className = "",
}: GlassCardProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Animated gradient border (outer) */}
      <div
        className="absolute -inset-[1px] rounded-3xl opacity-70 blur-[1px]"
        style={{
          background:
            "conic-gradient(from var(--angle), #8b5cf6, #60a5fa, #f472b6, #8b5cf6)",
          animation: "spin-border 6s linear infinite",
        }}
      />

      {/* Inner glass panel */}
      <div className="relative rounded-3xl p-8 glass-strong">
        {children}
      </div>

      {/* Keyframes injected inline (only needs to exist once) */}
      <style>{`
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spin-border {
          to { --angle: 360deg; }
        }
      `}</style>
    </div>
  );
}