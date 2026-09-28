import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  MessageSquare,
  MessagesSquare,
  Mic,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import KpiCard from "../components/KpiCard";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const COLORS = ["#8b5cf6", "#60a5fa", "#f472b6", "#34d399", "#fbbf24"];

async function fetchWithAuth(path: string) {
  const token = localStorage.getItem("access_token");
  const r = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`API ${path} failed`);
  return r.json();
}

export default function Dashboard() {
  const navigate = useNavigate();

  const kpis = useQuery({ queryKey: ["kpis"], queryFn: () => fetchWithAuth("/analytics/kpis") });
  const timeline = useQuery({ queryKey: ["timeline"], queryFn: () => fetchWithAuth("/analytics/messages-timeline") });
  const voiceSplit = useQuery({ queryKey: ["voiceSplit"], queryFn: () => fetchWithAuth("/analytics/voice-split") });
  const topUsers = useQuery({ queryKey: ["topUsers"], queryFn: () => fetchWithAuth("/analytics/top-users") });
  const modelUsage = useQuery({ queryKey: ["modelUsage"], queryFn: () => fetchWithAuth("/analytics/model-usage") });
  const heatmap = useQuery({ queryKey: ["heatmap"], queryFn: () => fetchWithAuth("/analytics/activity-heatmap") });

  const voiceData = voiceSplit.data
    ? [
        { name: "Voice", value: voiceSplit.data.voice_stt + voiceSplit.data.voice_tts },
        { name: "Text", value: Math.max(voiceSplit.data.total_messages - voiceSplit.data.voice_stt - voiceSplit.data.voice_tts, 0) },
      ]
    : [];

  return (
    <div className="relative w-full min-h-screen overflow-y-auto">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/30 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-pink-600/20 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto p-6 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text">Analytics</h1>
            <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live · refreshed every 5s
            </p>
          </div>
          <button
            onClick={() => navigate("/chat")}
            className="glass-strong px-4 py-2 rounded-xl hover:bg-white/15 transition"
          >
            ← Back to Chat
          </button>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Total Users"
            value={kpis.data?.total_users ?? 0}
            change={kpis.data?.user_growth_pct}
            icon={Users}
          />
          <KpiCard
            title="Conversations"
            value={kpis.data?.total_conversations ?? 0}
            icon={MessageSquare}
          />
          <KpiCard
            title="Messages"
            value={kpis.data?.total_messages ?? 0}
            icon={MessagesSquare}
          />
          <KpiCard
            title="Voice Interactions"
            value={kpis.data?.total_voice ?? 0}
            icon={Mic}
          />
        </div>

        {/* Messages timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-2xl p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              Messages Over Time
            </h2>
            <span className="text-xs text-gray-400">Last 30 days</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeline.data || []}>
              <defs>
                <linearGradient id="msgGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.4)"
                fontSize={11}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
                labelStyle={{ color: "#a78bfa" }}
              />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#msgGradient)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Two-column: Voice + Models */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-strong rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mic className="w-5 h-5 text-pink-400" />
              Voice vs Text
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={voiceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={1200}
                >
                  {voiceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,23,42,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 text-sm">
              {voiceData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: COLORS[i] }}
                  />
                  <span className="text-gray-300">
                    {d.name}: {d.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-strong rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Model Usage
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={modelUsage.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="model" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,23,42,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                  cursor={{ fill: "rgba(139,92,246,0.1)" }}
                />
                <Bar
                  dataKey="count"
                  fill="#60a5fa"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1200}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Bottom row: Top users + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-strong rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🏆 Top Users
            </h2>
            <div className="space-y-3">
              {(topUsers.data || []).map((u: any, i: number) => {
                const max = topUsers.data[0]?.messages || 1;
                const pct = (u.messages / max) * 100;
                return (
                  <div key={u.username}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-200">
                        #{i + 1} {u.username}
                      </span>
                      <span className="text-violet-400 font-medium">
                        {u.messages}
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                        className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
              {!topUsers.data?.length && (
                <p className="text-gray-500 text-sm">No data yet</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-strong rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">🕐 Hourly Activity</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={heatmap.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="hour"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={10}
                  tickFormatter={(h) => `${h}h`}
                />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,23,42,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                  cursor={{ fill: "rgba(244,114,182,0.1)" }}
                />
                <Bar
                  dataKey="messages"
                  fill="#f472b6"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1200}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
}