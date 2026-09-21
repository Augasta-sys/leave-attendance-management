import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="
        flex h-10 w-10 items-center justify-center
        rounded-xl border border-slate-200
        bg-white text-slate-600
        transition-all duration-200
        hover:bg-slate-100 hover:text-slate-900
        focus:outline-none focus:ring-2 focus:ring-blue-500
        dark:border-slate-700
        dark:bg-slate-800
        dark:text-slate-300
        dark:hover:bg-slate-700
        dark:hover:text-white
      "
    >
      {isDark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}