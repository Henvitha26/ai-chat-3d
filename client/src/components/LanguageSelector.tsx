import { Globe } from "lucide-react";

export const LANGUAGES = [
  { code: "auto", label: "Auto-detect", flag: "🌐" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "ta", label: "Tamil", flag: "🇮🇳" },
  { code: "te", label: "Telugu", flag: "🇮🇳" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
];

interface Props {
  value: string;
  onChange: (code: string) => void;
}

export default function LanguageSelector({ value, onChange }: Props) {
  const current = LANGUAGES.find((l) => l.code === value) || LANGUAGES[0];

  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-8 pr-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-200 cursor-pointer focus:outline-none focus:border-violet-500 transition"
        title="Reply language"
      >
        {LANGUAGES.map((l) => (
          <option
            key={l.code}
            value={l.code}
            className="bg-slate-900 text-white"
          >
            {l.flag} {l.label}
          </option>
        ))}
      </select>
      <Globe className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
    </div>
  );
}