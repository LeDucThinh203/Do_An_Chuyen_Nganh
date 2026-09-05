// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("coolshop_theme");
      if (savedTheme) return savedTheme;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch (e) {
      return "light";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("coolshop_theme", theme);
    } catch (e) {
      console.error(e);
    }

    const root = document.documentElement;
    const body = document.body;

    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      body.classList.add("theme-dark");
      body.classList.remove("theme-light");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      body.classList.add("theme-light");
      body.classList.remove("theme-dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
