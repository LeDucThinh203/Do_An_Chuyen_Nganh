import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeBackground() {
  const { isDark } = useTheme();

  return (
    <div className={`app-canvas${isDark ? " app-canvas--dark" : ""}`} aria-hidden="true">
      <div className="app-canvas__glow" />
    </div>
  );
}
