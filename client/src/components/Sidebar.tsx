import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MessageSquare, X } from "lucide-react";

export interface Conversation {
  id: number;
  title: string;
  model_used: string;
  created_at: string;
  updated_at: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onClose,
}: SidebarProps) {
  // Group conversations by date
  const grouped = groupByDate(conversations);

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-40 h-full w-72 flex-shrink-0 
          glass-strong border-r border-white/10 flex flex-col
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-white">Chats</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onNew}
            className="w-full btn-glow py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-white"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">
              No conversations yet
            </p>
          )}

          {Object.entries(grouped).map(([label, items]) => (
            <div key={label} className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2">
                {label}
              </p>
              <div className="space-y-1">
                {items.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    active={conv.id === activeId}
                    onClick={() => {
                      onSelect(conv.id);
                      onClose();
                    }}
                    onDelete={() => onDelete(conv.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

// ---------------------------------------------------------------
// Single conversation row with hover-delete
// ---------------------------------------------------------------
function ConversationItem({
  conversation,
  active,
  onClick,
  onDelete,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      className={`group relative rounded-lg px-3 py-2 cursor-pointer flex items-center gap-2 transition ${
        active
          ? "bg-gradient-to-r from-violet-600/40 to-indigo-600/30 border border-violet-500/40"
          : "hover:bg-white/5"
      }`}
      onClick={onClick}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400" />
      <span className="flex-1 text-sm text-gray-200 truncate">
        {conversation.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm("Delete this conversation?")) onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 hover:text-red-400 transition"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------
// Group by Today / Yesterday / Older
// ---------------------------------------------------------------
function groupByDate(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    Older: [],
  };

  for (const c of conversations) {
    const d = new Date(c.updated_at);
    if (d >= today) groups.Today.push(c);
    else if (d >= yesterday) groups.Yesterday.push(c);
    else groups.Older.push(c);
  }

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([, items]) => items.length > 0)
  );
}