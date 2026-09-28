import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../store/auth";
import { useNavigate } from "react-router-dom";
import AIOrb from "../components/AIOrb";
import ParticleField from "../components/ParticleField";
import CursorGlow from "../components/CursorGlow";
import GlassCard from "../components/GlassCard";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") await login(email, password);
      else await register(username, email, password);
      navigate("/chat");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Layer 1: Particle field */}
      <ParticleField />

      {/* Layer 2: Cursor glow */}
      <CursorGlow />

      {/* Layer 3: 3D orb (reduced opacity so card is readable) */}
      <div className="absolute inset-0 opacity-55">
        <AIOrb thinking={mode === "register"} />
      </div>

      {/* Layer 4: Brand logo top-left */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-6 left-6 z-20 flex items-center gap-2"
      >
        <div className="w-10 h-10 rounded-xl glass-strong flex items-center justify-center text-2xl">
          🌌
        </div>
        <span className="text-lg font-semibold gradient-text">AI Chat 3D</span>
      </motion.div>

      {/* Layer 5: Auth form */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 30, rotateY: -15 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            exit={{ opacity: 0, y: -30, rotateY: 15 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <GlassCard>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-bold text-center mb-2 gradient-text"
              >
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </motion.h1>
              <p className="text-center text-gray-400 text-sm mb-6">
                {mode === "login"
                  ? "Sign in to continue chatting with AI"
                  : "Join the future of AI conversations"}
              </p>

              <form onSubmit={submit} className="space-y-4">
                {mode === "register" && (
                  <motion.input
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition"
                  />
                )}

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition"
                />

                <input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition"
                />

                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-sm text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="btn-glow w-full py-3 rounded-xl font-semibold text-white shadow-lg disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "login"
                    ? "Sign In"
                    : "Sign Up"}
                </motion.button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already registered?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setError("");
                  }}
                  className="text-violet-400 hover:text-violet-300 font-medium transition"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>

              <p className="text-center text-xs text-gray-600 mt-4">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400">Enter</kbd> to submit
              </p>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}