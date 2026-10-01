import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../store/auth";
import { useSpeech } from "../hooks/useSpeech";
import AIOrb from "../components/AIOrb";
import ParticleField from "../components/ParticleField";
import CursorGlow from "../components/CursorGlow";
import MarkdownMessage from "../components/MarkdownMessage";
import MessageActions from "../components/MessageActions";
import MessageAvatar from "../components/MessageAvatar";
import StreamingCursor from "../components/StreamingCursor";
import PromptChips from "../components/PromptChips";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";
import ImageGenerator from "../components/ImageGenerator";
import Sidebar, { type Conversation } from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { Menu, Square, Paperclip } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
}

interface Attachment {
  filename: string;
  original_name: string;
  url: string;
  extracted_text: string;
  size: number;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Chat() {
  const { user, logout } = useAuth();
  const { listening, startListening, stopListening, speak, stopSpeaking } =
    useSpeech();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<string>("auto");

  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const token = () => localStorage.getItem("access_token");

  // ---------------------------------------------------------------
  // API helpers
  // ---------------------------------------------------------------
  const fetchConversations = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await r.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch conversations", e);
    }
  }, []);

  const loadMessages = useCallback(async (convId: number) => {
    try {
      const r = await fetch(`${API_URL}/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await r.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load messages", e);
      setMessages([]);
    }
  }, []);

  const createConversation = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ title: "New Chat" }),
      });
      const conv = await r.json();
      setConversationId(conv.id);
      setMessages([]);
      await fetchConversations();
      return conv.id as number;
    } catch (e) {
      console.error("Failed to create conversation", e);
      return null;
    }
  }, [fetchConversations]);

  // ---------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (conversationId) return;
    if (conversations.length > 0) {
      const latest = conversations[0];
      setConversationId(latest.id);
      loadMessages(latest.id);
    }
  }, [conversations, conversationId, loadMessages]);

  // ---------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------
  const handleNewChat = async () => {
    stopSpeaking();
    setAttachment(null);
    const id = await createConversation();
    if (id) {
      setConversationId(id);
      setMessages([]);
    }
  };

  const handleSelectConversation = (id: number) => {
    if (id === conversationId) return;
    stopSpeaking();
    setAttachment(null);
    setConversationId(id);
    loadMessages(id);
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await fetch(`${API_URL}/conversations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      await fetchConversations();
      if (id === conversationId) {
        stopSpeaking();
        setConversationId(null);
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setThinking(false);
    setSpeaking(false);
    stopSpeaking();
  };

  // ---------------------------------------------------------------
  // Core: send message
  // ---------------------------------------------------------------
  const sendMessageInternal = async (
    text: string,
    opts: { skipUserBubble?: boolean } = {}
  ) => {
    if (!text.trim() || streaming) return;

    let convId = conversationId;
    if (!convId) {
      convId = await createConversation();
      if (!convId) return;
    }

    setThinking(true);

    if (!opts.skipUserBubble) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "user", content: text },
      ]);
    }

    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(
        `${API_URL}/conversations/${convId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify({ content: text, language }),
          signal: controller.signal,
        }
      );

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";
      let assistantMessageAdded = false;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let chunk = line.slice(6);

          if (chunk === "[DONE]") break;
          if (chunk.startsWith("[TITLE]")) continue;
          if (chunk.startsWith("[ERROR]")) {
            console.error(chunk);
            continue;
          }

          chunk = chunk.replace(/\\n/g, "\n");
          aiText += chunk;

          if (!assistantMessageAdded) {
            setThinking(false);
            setSpeaking(true);
            assistantMessageAdded = true;
            setMessages((prev) => [
              ...prev,
              { id: Date.now() + 1, role: "assistant", content: aiText },
            ]);
          } else {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: aiText,
              };
              return updated;
            });
          }
        }
      }

      setSpeaking(false);
      if (aiText) speak(aiText);

      await fetchConversations();
    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.log("Generation stopped by user");
      } else {
        console.error(err);
      }
      setThinking(false);
      setSpeaking(false);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const sendMessage = () => {
    if ((!input.trim() && !attachment) || streaming) return;

    let text = input.trim();

    if (attachment) {
      const fileCtx = attachment.extracted_text
        ? `\n\n[Attached file: ${attachment.original_name}]\n---\n${attachment.extracted_text}\n---\n`
        : `\n\n[Attached file: ${attachment.original_name} — no extractable text]\n`;
      text = (text || "Please analyze the attached file.") + fileCtx;
      setAttachment(null);
    }

    setInput("");
    sendMessageInternal(text);
  };

  const regenerateLast = async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || streaming) return;

    setMessages((prev) => {
      const lastAssistantIdx = [...prev]
        .reverse()
        .findIndex((m) => m.role === "assistant");
      if (lastAssistantIdx === -1) return prev;
      const actualIdx = prev.length - 1 - lastAssistantIdx;
      return prev.filter((_, i) => i !== actualIdx);
    });

    await sendMessageInternal(lastUser.content, { skipUserBubble: true });
  };

  const handleVoice = () => {
    if (listening) stopListening();
    else startListening((text) => setInput((prev) => prev + text));
  };

  // ---------------------------------------------------------------
  // File upload
  // ---------------------------------------------------------------
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const r = await fetch(`${API_URL}/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as Attachment;
      setAttachment(data);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Check file type and size (max 10 MB).");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ---------------------------------------------------------------
  // Image generation
  // ---------------------------------------------------------------
  const handleImageGenerated = async (url: string, prompt: string) => {
    if (!conversationId) {
      const id = await createConversation();
      if (!id) return;
    }
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: `🎨 Generate: ${prompt}` },
      {
        id: Date.now() + 1,
        role: "assistant",
        content: `![${prompt}](${url})\n\n*Generated with Pollinations.ai* — [Open original](${url})`,
      },
    ]);
  };

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------
  return (
    <div className="relative w-full chat-viewport overflow-hidden flex">
      <ParticleField />
      <CursorGlow />
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <AIOrb thinking={thinking} speaking={speaking} />
      </div>

      <Sidebar
        conversations={conversations}
        activeId={conversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="relative z-10 flex flex-col flex-1 min-w-0">
        {/* ---------- HEADER ---------- */}
        <header className="glass border-b border-white/10 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-lg font-bold gradient-text">AI Chat 3D</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 hidden sm:inline">
              Hi, {user?.username || "friend"}
            </span>
            <ThemeToggle />
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              📊 Analytics
            </button>
            <button
              onClick={() => {
                stopSpeaking();
                abortRef.current?.abort();
                logout();
                navigate("/login");
              }}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* ---------- MESSAGES ---------- */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        >
          {/* Empty state with prompt chips */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-12"
            >
              <h2 className="text-3xl font-bold gradient-text mb-2">
                Start a Conversation
              </h2>
              <p className="text-gray-400 mb-4">
                Ask anything — type, speak, upload a file, or generate an image
              </p>
              <PromptChips
                onSelect={(text) => {
                  setInput(text);
                }}
              />
            </motion.div>
          )}

          {/* Message list */}
          <AnimatePresence>
            {messages.map((m, idx) => {
              const isLastAssistant =
                m.role === "assistant" &&
                idx === messages.length - 1 &&
                !streaming;
              const isCurrentlyStreaming =
                m.role === "assistant" &&
                idx === messages.length - 1 &&
                streaming;

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-2 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* AI avatar (left) */}
                  {m.role === "assistant" && <MessageAvatar role="assistant" />}

                  {/* Message bubble */}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 break-words ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white whitespace-pre-wrap"
                        : "glass text-gray-100"
                    }`}
                  >
                    {m.role === "user" ? (
                      m.content
                    ) : (
                      <>
                        <MarkdownMessage content={m.content} />
                        {/* Blinking cursor while streaming */}
                        {isCurrentlyStreaming && (
                          <StreamingCursor isStreaming={true} />
                        )}
                        {/* Actions after streaming completes */}
                        {isLastAssistant && (
                          <MessageActions
                            content={m.content}
                            onRegenerate={regenerateLast}
                            onSpeak={() => speak(m.content)}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* User avatar (right) */}
                  {m.role === "user" && (
                    <MessageAvatar role="user" username={user?.username} />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Thinking indicator */}
          {thinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2 justify-start"
            >
              <MessageAvatar role="assistant" />
              <div className="glass rounded-2xl px-4 py-3 flex gap-1 items-center">
                <span className="typing-dot w-2 h-2 rounded-full bg-violet-400" />
                <span className="typing-dot w-2 h-2 rounded-full bg-violet-400" />
                <span className="typing-dot w-2 h-2 rounded-full bg-violet-400" />
              </div>
            </motion.div>
          )}
        </div>

        {/* ---------- INPUT BAR ---------- */}
        <div className="glass border-t border-white/10 p-4 relative">
          {/* Attachment chip */}
          {attachment && (
            <div className="absolute -top-10 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600/30 border border-violet-500/40 text-xs backdrop-blur-sm">
              <span className="text-white truncate max-w-[200px]">
                📎 {attachment.original_name}
              </span>
              <button
                onClick={() => setAttachment(null)}
                className="text-gray-300 hover:text-white"
                title="Remove attachment"
              >
                ✕
              </button>
            </div>
          )}

          <div className="max-w-4xl mx-auto flex gap-2 items-center">
            <LanguageSelector value={language} onChange={setLanguage} />

            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.txt,.md,.csv,.json,.py,.js,.ts,.tsx,.java,.cpp,.c,.html,.css"
              onChange={handleFileSelect}
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
              title="Attach file"
            >
              {uploading ? (
                <span className="text-xs">...</span>
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </motion.button>

            <ImageGenerator onGenerated={handleImageGenerated} />

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage()
              }
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVoice}
              className={`p-3 rounded-xl transition ${
                listening
                  ? "bg-red-500 animate-pulse"
                  : "bg-white/5 hover:bg-white/10"
              }`}
              title="Voice input"
            >
              🎤
            </motion.button>

            {streaming ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopStreaming}
                className="px-5 py-3 rounded-xl font-semibold text-white bg-red-500/80 hover:bg-red-500 transition flex items-center gap-2"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-white" />
                Stop
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!input.trim() && !attachment}
                className="btn-glow px-5 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
              >
                Send
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}