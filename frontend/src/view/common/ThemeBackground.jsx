// src/view/common/ThemeBackground.jsx
import React, { useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";

// Pre-generated static coordinates so animations don't recalculate on every re-render
const LIGHT_STARS = [
  { id: 1, top: "6%", left: "8%", size: 14, type: "diamond", color: "#fbbf24", duration: "3.2s", delay: "0.2s" },
  { id: 2, top: "12%", left: "24%", size: 6, type: "circle", color: "#60a5fa", duration: "2.5s", delay: "0.8s" },
  { id: 3, top: "8%", left: "45%", size: 18, type: "diamond", color: "#f59e0b", duration: "3.8s", delay: "1.4s" },
  { id: 4, top: "15%", left: "68%", size: 8, type: "sparkle", color: "#38bdf8", duration: "2.8s", delay: "0.5s" },
  { id: 5, top: "9%", left: "88%", size: 16, type: "diamond", color: "#fbbf24", duration: "3.5s", delay: "1.9s" },
  { id: 6, top: "22%", left: "14%", size: 7, type: "circle", color: "#eab308", duration: "2.2s", delay: "1.1s" },
  { id: 7, top: "28%", left: "35%", size: 15, type: "sparkle", color: "#60a5fa", duration: "4.1s", delay: "0.3s" },
  { id: 8, top: "24%", left: "58%", size: 12, type: "diamond", color: "#fbbf24", duration: "3.0s", delay: "2.1s" },
  { id: 9, top: "32%", left: "82%", size: 7, type: "circle", color: "#38bdf8", duration: "2.4s", delay: "1.6s" },
  { id: 10, top: "38%", left: "4%", size: 16, type: "diamond", color: "#f59e0b", duration: "3.6s", delay: "0.7s" },
  { id: 11, top: "42%", left: "22%", size: 9, type: "sparkle", color: "#fbbf24", duration: "2.9s", delay: "1.8s" },
  { id: 12, top: "48%", left: "48%", size: 6, type: "circle", color: "#60a5fa", duration: "2.6s", delay: "2.4s" },
  { id: 13, top: "44%", left: "74%", size: 17, type: "diamond", color: "#f59e0b", duration: "3.9s", delay: "0.9s" },
  { id: 14, top: "52%", left: "92%", size: 8, type: "sparkle", color: "#38bdf8", duration: "3.1s", delay: "1.3s" },
  { id: 15, top: "59%", left: "12%", size: 14, type: "diamond", color: "#fbbf24", duration: "3.4s", delay: "2.7s" },
  { id: 16, top: "65%", left: "32%", size: 7, type: "circle", color: "#eab308", duration: "2.7s", delay: "0.4s" },
  { id: 17, top: "62%", left: "62%", size: 18, type: "diamond", color: "#f59e0b", duration: "4.2s", delay: "1.7s" },
  { id: 18, top: "68%", left: "84%", size: 9, type: "sparkle", color: "#60a5fa", duration: "2.5s", delay: "2.2s" },
  { id: 19, top: "75%", left: "6%", size: 8, type: "circle", color: "#38bdf8", duration: "2.8s", delay: "1.0s" },
  { id: 20, top: "79%", left: "26%", size: 16, type: "diamond", color: "#fbbf24", duration: "3.7s", delay: "0.6s" },
  { id: 21, top: "82%", left: "52%", size: 7, type: "sparkle", color: "#f59e0b", duration: "3.1s", delay: "2.5s" },
  { id: 22, top: "77%", left: "71%", size: 15, type: "diamond", color: "#60a5fa", duration: "4.0s", delay: "1.5s" },
  { id: 23, top: "86%", left: "90%", size: 8, type: "circle", color: "#fbbf24", duration: "2.3s", delay: "0.2s" },
  { id: 24, top: "92%", left: "18%", size: 17, type: "diamond", color: "#f59e0b", duration: "3.6s", delay: "2.0s" },
  { id: 25, top: "94%", left: "42%", size: 6, type: "circle", color: "#38bdf8", duration: "2.9s", delay: "1.2s" },
  { id: 26, top: "90%", left: "65%", size: 14, type: "sparkle", color: "#fbbf24", duration: "3.3s", delay: "0.8s" },
  { id: 27, top: "95%", left: "82%", size: 10, type: "diamond", color: "#60a5fa", duration: "3.5s", delay: "2.6s" },
  { id: 28, top: "18%", left: "95%", size: 12, type: "sparkle", color: "#f59e0b", duration: "2.7s", delay: "1.4s" },
  { id: 29, top: "35%", left: "44%", size: 8, type: "circle", color: "#fbbf24", duration: "3.2s", delay: "0.1s" },
  { id: 30, top: "54%", left: "38%", size: 15, type: "diamond", color: "#38bdf8", duration: "3.9s", delay: "2.3s" }
];

// Realistic shooting stars (mưa sao băng) with randomized positions & delays
const METEORS = [
  { id: 1, top: "-80px", right: "5%", length: 180, duration: "2.4s", delay: "0s" },
  { id: 2, top: "-60px", right: "22%", length: 140, duration: "2.8s", delay: "1.2s" },
  { id: 3, top: "-100px", right: "38%", length: 210, duration: "2.1s", delay: "0.5s" },
  { id: 4, top: "-50px", right: "55%", length: 160, duration: "3.1s", delay: "2.4s" },
  { id: 5, top: "-90px", right: "72%", length: 190, duration: "2.6s", delay: "1.7s" },
  { id: 6, top: "-40px", right: "88%", length: 130, duration: "3.4s", delay: "3.2s" },
  { id: 7, top: "80px", right: "-40px", length: 170, duration: "2.3s", delay: "0.8s" },
  { id: 8, top: "160px", right: "-30px", length: 220, duration: "2.0s", delay: "2.9s" },
  { id: 9, top: "240px", right: "-50px", length: 150, duration: "2.9s", delay: "1.5s" },
  { id: 10, top: "-70px", right: "15%", length: 195, duration: "2.5s", delay: "3.8s" },
  { id: 11, top: "-50px", right: "30%", length: 165, duration: "2.2s", delay: "4.5s" },
  { id: 12, top: "-85px", right: "48%", length: 230, duration: "1.9s", delay: "2.1s" },
  { id: 13, top: "-65px", right: "65%", length: 145, duration: "3.0s", delay: "3.5s" },
  { id: 14, top: "-95px", right: "82%", length: 175, duration: "2.7s", delay: "0.2s" },
  { id: 15, top: "320px", right: "-60px", length: 200, duration: "2.4s", delay: "4.1s" },
  { id: 16, top: "-110px", right: "95%", length: 185, duration: "2.6s", delay: "5.0s" },
];

// Dark background static twinkling stars
const DARK_STARS = [
  { id: 1, top: "5%", left: "12%", size: 3, delay: "0.5s", duration: "3s" },
  { id: 2, top: "8%", left: "34%", size: 2, delay: "1.8s", duration: "4s" },
  { id: 3, top: "14%", left: "56%", size: 4, delay: "0.2s", duration: "2.5s" },
  { id: 4, top: "11%", left: "78%", size: 3, delay: "2.4s", duration: "3.5s" },
  { id: 5, top: "19%", left: "92%", size: 2, delay: "1.1s", duration: "4.2s" },
  { id: 6, top: "25%", left: "18%", size: 3, delay: "3.0s", duration: "3s" },
  { id: 7, top: "31%", left: "42%", size: 4, delay: "0.8s", duration: "2.8s" },
  { id: 8, top: "28%", left: "68%", size: 2, delay: "2.1s", duration: "3.7s" },
  { id: 9, top: "38%", left: "85%", size: 3, delay: "1.5s", duration: "4s" },
  { id: 10, top: "45%", left: "8%", size: 2, delay: "0.3s", duration: "3.2s" },
  { id: 11, top: "52%", left: "28%", size: 4, delay: "2.7s", duration: "2.6s" },
  { id: 12, top: "49%", left: "53%", size: 2, delay: "1.9s", duration: "3.8s" },
  { id: 13, top: "58%", left: "75%", size: 3, delay: "0.7s", duration: "3.1s" },
  { id: 14, top: "66%", left: "94%", size: 2, delay: "3.3s", duration: "4.5s" },
  { id: 15, top: "72%", left: "15%", size: 3, delay: "1.4s", duration: "2.9s" },
  { id: 16, top: "78%", left: "39%", size: 4, delay: "2.2s", duration: "3.4s" },
  { id: 17, top: "84%", left: "62%", size: 2, delay: "0.9s", duration: "4.1s" },
  { id: 18, top: "81%", left: "88%", size: 3, delay: "2.5s", duration: "3s" },
  { id: 19, top: "92%", left: "25%", size: 2, delay: "1.7s", duration: "3.6s" },
  { id: 20, top: "95%", left: "70%", size: 3, delay: "0.4s", duration: "2.7s" },
];

export default function ThemeBackground() {
  const { isDark } = useTheme();

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-1000"
      aria-hidden="true"
    >
      {/* =========================================================
          LIGHT THEME: Luminous Pearl & Sparkling Stars (Ánh sao lấp lánh)
          ========================================================= */}
      {!isDark && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#eef2ff]">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-200/20 blur-[130px]" />
          <div className="absolute top-1/3 -right-40 w-[650px] h-[650px] rounded-full bg-indigo-200/20 blur-[140px]" />
          <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full bg-amber-100/30 blur-[150px]" />

          {/* Sparkling Stars Container */}
          <div className="absolute inset-0">
            {LIGHT_STARS.map((star) => {
              if (star.type === "diamond") {
                return (
                  <div
                    key={star.id}
                    className="absolute animate-diamond-sparkle"
                    style={{
                      top: star.top,
                      left: star.left,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      "--duration": star.duration,
                      "--delay": star.delay,
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="w-full h-full" fill={star.color}>
                      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                    </svg>
                  </div>
                );
              }

              if (star.type === "sparkle") {
                return (
                  <div
                    key={star.id}
                    className="absolute animate-twinkle"
                    style={{
                      top: star.top,
                      left: star.left,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      "--duration": star.duration,
                      "--delay": star.delay,
                    }}
                  >
                    <svg viewBox="0 0 20 20" className="w-full h-full" fill={star.color}>
                      <circle cx="10" cy="10" r="4" />
                      <line x1="10" y1="1" x2="10" y2="19" stroke={star.color} strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="1" y1="10" x2="19" y2="10" stroke={star.color} strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                );
              }

              return (
                <div
                  key={star.id}
                  className="absolute rounded-full animate-twinkle"
                  style={{
                    top: star.top,
                    left: star.left,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    backgroundColor: star.color,
                    boxShadow: `0 0 8px ${star.color}, 0 0 14px #ffffff`,
                    "--duration": star.duration,
                    "--delay": star.delay,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          DARK THEME: Cosmic Space & Meteor Shower (Mưa sao băng)
          ========================================================= */}
      {isDark && (
        <div className="absolute inset-0 bg-[#060913]">
          {/* Deep Cosmic Radial Gradients / Nebulae */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#040711] via-[#070d1d] to-[#0a122c] opacity-95" />
          <div className="absolute top-0 right-1/4 w-[650px] h-[650px] rounded-full bg-blue-900/15 blur-[160px]" />
          <div className="absolute bottom-10 left-10 w-[700px] h-[700px] rounded-full bg-indigo-950/25 blur-[180px]" />
          <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-purple-950/15 blur-[170px]" />

          {/* Background Static Stars */}
          <div className="absolute inset-0">
            {DARK_STARS.map((s) => (
              <div
                key={s.id}
                className="absolute rounded-full bg-white animate-twinkle"
                style={{
                  top: s.top,
                  left: s.left,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  boxShadow: "0 0 6px 1px rgba(255, 255, 255, 0.8)",
                  "--duration": s.duration,
                  "--delay": s.delay,
                }}
              />
            ))}
          </div>

          {/* Dynamic Meteor Shower (Mưa Sao Băng) */}
          <div className="absolute inset-0 overflow-hidden">
            {METEORS.map((m) => (
              <div
                key={m.id}
                className="meteor-streak"
                style={{
                  top: m.top,
                  right: m.right,
                  width: `${m.length}px`,
                  animationDuration: m.duration,
                  animationDelay: m.delay,
                }}
              >
                <div className="meteor-head" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
