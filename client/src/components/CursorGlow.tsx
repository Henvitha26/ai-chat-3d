import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Smooth easing toward target
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouse);
    const id = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      cancelAnimationFrame(id);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="fixed pointer-events-none"
      style={{
        zIndex: 2,
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(96,165,250,0.08) 30%, transparent 70%)",
        filter: "blur(40px)",
        mixBlendMode: "screen",
        willChange: "transform",
      }}
    />
  );
}