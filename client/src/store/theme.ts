import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  // Default: dark (matches your design)
  return "dark";
};

const applyTheme = (theme: Theme) => {
  const html = document.documentElement;
  if (theme === "light") html.classList.add("light");
  else html.classList.remove("light");
  localStorage.setItem("theme", theme);
};

export const useTheme = create<ThemeState>((set) => ({
  theme: getInitialTheme(),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      return { theme: next };
    }),

  setTheme: (t) => {
    applyTheme(t);
    set({ theme: t });
  },
}));

// Apply on first load
applyTheme(getInitialTheme());