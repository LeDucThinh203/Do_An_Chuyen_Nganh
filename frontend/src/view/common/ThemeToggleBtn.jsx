// src/view/common/ThemeToggleBtn.jsx
import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggleBtn({ variant = "navbar", className = "" }) {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === "floating") {
    return (
      <div className={`fixed bottom-6 left-6 z-[1200] ${className}`}>
        <button
          onClick={toggleTheme}
          type="button"
          aria-label={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
          title={isDark ? "Chuyển sang Giao diện Sáng (Ánh sao lấp lánh)" : "Chuyển sang Giao diện Tối (Mưa sao băng)"}
          className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border backdrop-blur-md ${
            isDark
              ? "bg-slate-900/90 text-amber-300 border-amber-500/30 hover:border-amber-400/60 shadow-indigo-950/60"
              : "bg-white/90 text-indigo-700 border-slate-200/80 hover:border-indigo-400 shadow-slate-300/40"
          }`}
        >
          {isDark ? (
            <>
              <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300 group-hover:rotate-45 transition-transform">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-200 pr-1 hidden sm:inline-block">
                Mưa sao băng 🌠
              </span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 group-hover:rotate-90 transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-700 pr-1 hidden sm:inline-block">
                Ánh sao ✨
              </span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Default navbar variant
  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
      title={isDark ? "Chuyển sang Giao diện Sáng (Ánh sao lấp lánh)" : "Chuyển sang Giao diện Tối (Mưa sao băng)"}
      className={`relative p-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center border group ${
        isDark
          ? "bg-slate-800/80 text-amber-300 border-slate-700 hover:bg-slate-700/80 hover:border-amber-400/50 shadow-md shadow-amber-500/10"
          : "bg-white/80 text-slate-700 border-slate-200/80 hover:bg-amber-50/80 hover:text-amber-600 hover:border-amber-300 shadow-sm"
      } ${className}`}
    >
      {isDark ? (
        <svg
          className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform duration-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 text-amber-500 group-hover:rotate-90 transition-transform duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  );
}
