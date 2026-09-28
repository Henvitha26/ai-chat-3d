import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownMessageProps {
  content: string;
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="prose prose-invert max-w-none text-gray-100 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // ---------- Custom code block with copy button ----------
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const code = String(children).replace(/\n$/, "");

            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-white/10 text-pink-300 text-[0.9em] font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlock language={language} code={code} />;
          },

          // ---------- Text elements ----------
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,

          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="ml-2">{children}</li>,

          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-3 mt-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-2 mt-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-2 mt-3">{children}</h3>
          ),

          // ---------- Links ----------
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 underline hover:text-violet-300"
            >
              {children}
            </a>
          ),

          // ---------- Blockquote ----------
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-violet-500/50 pl-4 italic my-3 text-gray-400">
              {children}
            </blockquote>
          ),

          // ---------- Tables ----------
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border border-white/10 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 bg-white/5 text-left font-semibold border-b border-white/10">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-white/5">{children}</td>
          ),

          // ---------- Horizontal rule ----------
          hr: () => <hr className="my-4 border-white/10" />,

          // ---------- IMAGES (used by AI image generation) ----------
          img: ({ src, alt }) => (
            <img
              src={typeof src === "string" ? src : ""}
              alt={alt || "generated image"}
              className="rounded-xl max-w-full my-3 border border-white/10 shadow-lg"
              loading="lazy"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ---------------------------------------------------------------
// Code block with copy button and syntax highlighting
// ---------------------------------------------------------------
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-white/10">
      {/* Header bar with language + copy */}
      <div className="flex justify-between items-center px-3 py-1.5 bg-black/40 border-b border-white/10">
        <span className="text-xs text-gray-400 font-mono">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Highlighted code */}
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "rgba(0,0,0,0.5)",
          fontSize: "0.875rem",
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}