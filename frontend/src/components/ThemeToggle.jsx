import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 ${
        isDark
          ? "border-slate-700/80 bg-slate-800/80 text-amber-400 hover:border-amber-400/50 hover:bg-slate-800 shadow-sm shadow-amber-400/10"
          : "border-slate-300 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-600 shadow-sm shadow-slate-200"
      } ${className}`}
    >
      <div className="relative h-4.5 w-4.5 transition-transform duration-500 group-hover:rotate-45">
        {isDark ? (
          <Sun className="h-4.5 w-4.5 transition-all text-amber-300" />
        ) : (
          <Moon className="h-4.5 w-4.5 transition-all text-slate-700 group-hover:text-emerald-600" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
