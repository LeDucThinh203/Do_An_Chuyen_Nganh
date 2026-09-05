// src/view/common/ThemeBackground.jsx
import React from "react";
import { useTheme } from "../../context/ThemeContext";

// Gentle twinkling stars for Light Mode (nhẹ nhàng, thanh tao, thư giãn)
const GENTLE_LIGHT_STARS = [
  { id: 1, top: "7%", left: "9%", size: 8, type: "diamond", color: "#fcd34d", duration: "5.5s", delay: "0.5s" },
  { id: 2, top: "11%", left: "23%", size: 4, type: "circle", color: "#93c5fd", duration: "6.2s", delay: "1.8s" },
  { id: 3, top: "9%", left: "42%", size: 9, type: "diamond", color: "#fde68a", duration: "6.8s", delay: "0.2s" },
  { id: 4, top: "14%", left: "67%", size: 6, type: "sparkle", color: "#bae6fd", duration: "5.0s", delay: "2.5s" },
  { id: 5, top: "8%", left: "86%", size: 8, type: "diamond", color: "#fcd34d", duration: "7.1s", delay: "1.2s" },
  { id: 6, top: "21%", left: "15%", size: 4, type: "circle", color: "#fde68a", duration: "5.8s", delay: "3.1s" },
  { id: 7, top: "27%", left: "33%", size: 8, type: "sparkle", color: "#93c5fd", duration: "6.5s", delay: "0.7s" },
  { id: 8, top: "23%", left: "57%", size: 7, type: "diamond", color: "#fcd34d", duration: "5.3s", delay: "2.1s" },
  { id: 9, top: "30%", left: "81%", size: 4, type: "circle", color: "#bae6fd", duration: "6.9s", delay: "1.5s" },
  { id: 10, top: "37%", left: "5%", size: 8, type: "diamond", color: "#fde68a", duration: "5.7s", delay: "3.5s" },
  { id: 11, top: "41%", left: "21%", size: 6, type: "sparkle", color: "#fcd34d", duration: "6.3s", delay: "0.9s" },
  { id: 12, top: "47%", left: "47%", size: 4, type: "circle", color: "#93c5fd", duration: "5.9s", delay: "2.8s" },
  { id: 13, top: "43%", left: "73%", size: 9, type: "diamond", color: "#fde68a", duration: "7.3s", delay: "1.7s" },
  { id: 14, top: "51%", left: "91%", size: 5, type: "sparkle", color: "#bae6fd", duration: "5.2s", delay: "3.3s" },
  { id: 15, top: "58%", left: "11%", size: 8, type: "diamond", color: "#fcd34d", duration: "6.4s", delay: "0.4s" },
  { id: 16, top: "64%", left: "31%", size: 4, type: "circle", color: "#fde68a", duration: "5.6s", delay: "2.2s" },
  { id: 17, top: "61%", left: "61%", size: 9, type: "diamond", color: "#fcd34d", duration: "7.0s", delay: "1.1s" },
  { id: 18, top: "67%", left: "83%", size: 5, type: "sparkle", color: "#93c5fd", duration: "6.1s", delay: "3.7s" },
  { id: 19, top: "74%", left: "7%", size: 4, type: "circle", color: "#bae6fd", duration: "5.4s", delay: "1.9s" },
  { id: 20, top: "78%", left: "25%", size: 8, type: "diamond", color: "#fde68a", duration: "6.6s", delay: "0.6s" },
  { id: 21, top: "81%", left: "51%", size: 5, type: "sparkle", color: "#fcd34d", duration: "5.8s", delay: "2.9s" },
  { id: 22, top: "76%", left: "70%", size: 8, type: "diamond", color: "#93c5fd", duration: "7.2s", delay: "1.4s" },
  { id: 23, top: "85%", left: "89%", size: 4, type: "circle", color: "#fde68a", duration: "6.0s", delay: "3.0s" },
  { id: 24, top: "91%", left: "17%", size: 8, type: "diamond", color: "#fcd34d", duration: "6.7s", delay: "0.8s" },
  { id: 25, top: "93%", left: "41%", size: 4, type: "circle", color: "#bae6fd", duration: "5.5s", delay: "2.4s" },
  { id: 26, top: "89%", left: "64%", size: 6, type: "sparkle", color: "#fde68a", duration: "6.2s", delay: "1.6s" },
  { id: 27, top: "94%", left: "81%", size: 7, type: "diamond", color: "#93c5fd", duration: "7.4s", delay: "3.4s" },
];

// Delicate Tiny Star Rain for Dark Mode (ngôi sao như mưa rơi nhỏ nhẹ, thanh tao, êm đềm)
const TINY_STAR_RAIN = [
  { id: 1, top: "-30px", left: "6%", length: 18, duration: "5.5s", delay: "0.2s" },
  { id: 2, top: "-40px", left: "15%", length: 22, duration: "4.8s", delay: "1.9s" },
  { id: 3, top: "-25px", left: "24%", length: 15, duration: "6.2s", delay: "4.1s" },
  { id: 4, top: "-50px", left: "33%", length: 25, duration: "5.1s", delay: "0.8s" },
  { id: 5, top: "-35px", left: "42%", length: 19, duration: "5.8s", delay: "3.2s" },
  { id: 6, top: "-45px", left: "51%", length: 24, duration: "5.4s", delay: "5.4s" },
  { id: 7, top: "-30px", left: "60%", length: 16, duration: "6.0s", delay: "2.4s" },
  { id: 8, top: "-40px", left: "69%", length: 20, duration: "4.9s", delay: "3.8s" },
  { id: 9, top: "-25px", left: "78%", length: 17, duration: "5.7s", delay: "1.2s" },
  { id: 10, top: "-45px", left: "87%", length: 23, duration: "5.3s", delay: "5.9s" },
  { id: 11, top: "-30px", left: "95%", length: 16, duration: "6.1s", delay: "2.8s" },
  { id: 12, top: "80px", left: "10%", length: 18, duration: "5.2s", delay: "4.5s" },
  { id: 13, top: "140px", left: "29%", length: 22, duration: "5.9s", delay: "1.6s" },
  { id: 14, top: "100px", left: "48%", length: 17, duration: "5.5s", delay: "3.6s" },
  { id: 15, top: "170px", left: "67%", length: 24, duration: "5.0s", delay: "0.6s" },
  { id: 16, top: "120px", left: "83%", length: 19, duration: "6.3s", delay: "4.9s" },
  { id: 17, top: "-35px", left: "19%", length: 21, duration: "5.6s", delay: "2.7s" },
  { id: 18, top: "-40px", left: "57%", length: 16, duration: "5.8s", delay: "1.0s" },
  { id: 19, top: "-25px", left: "74%", length: 23, duration: "5.2s", delay: "4.3s" },
  { id: 20, top: "-50px", left: "92%", length: 18, duration: "6.0s", delay: "0.4s" },
];

// Dark background subtle static stars
const DARK_STARS = [
  { id: 1, top: "6%", left: "11%", size: 2.5, delay: "0.5s", duration: "4.5s" },
  { id: 2, top: "9%", left: "32%", size: 2, delay: "2.2s", duration: "5.5s" },
  { id: 3, top: "15%", left: "54%", size: 3, delay: "0.8s", duration: "4.0s" },
  { id: 4, top: "12%", left: "76%", size: 2, delay: "3.1s", duration: "5.0s" },
  { id: 5, top: "20%", left: "91%", size: 2.5, delay: "1.4s", duration: "6.0s" },
  { id: 6, top: "26%", left: "16%", size: 2, delay: "3.7s", duration: "4.8s" },
  { id: 7, top: "33%", left: "40%", size: 3, delay: "1.1s", duration: "4.2s" },
  { id: 8, top: "29%", left: "66%", size: 2, delay: "2.6s", duration: "5.2s" },
  { id: 9, top: "39%", left: "84%", size: 2.5, delay: "1.8s", duration: "5.8s" },
  { id: 10, top: "46%", left: "7%", size: 2, delay: "0.4s", duration: "4.6s" },
  { id: 11, top: "54%", left: "27%", size: 3, delay: "3.4s", duration: "4.1s" },
  { id: 12, top: "50%", left: "51%", size: 2, delay: "2.4s", duration: "5.4s" },
  { id: 13, top: "60%", left: "73%", size: 2.5, delay: "1.0s", duration: "4.9s" },
  { id: 14, top: "68%", left: "93%", size: 2, delay: "4.0s", duration: "6.2s" },
  { id: 15, top: "73%", left: "13%", size: 2.5, delay: "1.7s", duration: "4.4s" },
  { id: 16, top: "80%", left: "37%", size: 3, delay: "2.8s", duration: "5.1s" },
  { id: 17, top: "86%", left: "60%", size: 2, delay: "1.3s", duration: "5.7s" },
  { id: 18, top: "83%", left: "86%", size: 2.5, delay: "3.2s", duration: "4.7s" },
  { id: 19, top: "93%", left: "23%", size: 2, delay: "2.1s", duration: "5.3s" },
  { id: 20, top: "96%", left: "68%", size: 2.5, delay: "0.6s", duration: "4.3s" },
];

export default function ThemeBackground() {
  const { isDark } = useTheme();

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-700"
      aria-hidden="true"
    >
      {/* =========================================================
          LIGHT THEME: Luminous Pearl & Gentle Sparkling Stars
          ========================================================= */}
      {!isDark && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#eef2ff]">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-[140px]" />
          <div className="absolute top-1/3 -right-40 w-[650px] h-[650px] rounded-full bg-indigo-100/40 blur-[150px]" />
          <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full bg-amber-50/50 blur-[160px]" />

          {/* Gentle Sparkling Stars */}
          <div className="absolute inset-0">
            {GENTLE_LIGHT_STARS.map((star) => {
              if (star.type === "diamond") {
                return (
                  <div
                    key={star.id}
                    className="absolute animate-gentle-diamond"
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
                    className="absolute animate-gentle-twinkle"
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
                      <circle cx="10" cy="10" r="3" />
                      <line x1="10" y1="2" x2="10" y2="18" stroke={star.color} strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="2" y1="10" x2="18" y2="10" stroke={star.color} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                );
              }

              return (
                <div
                  key={star.id}
                  className="absolute rounded-full animate-gentle-twinkle"
                  style={{
                    top: star.top,
                    left: star.left,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    backgroundColor: star.color,
                    boxShadow: `0 0 6px ${star.color}`,
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
          DARK THEME: Cosmic Night & Gentle Meteor Rain (Mưa sao băng nhẹ nhàng)
          ========================================================= */}
      {isDark && (
        <div className="absolute inset-0 bg-[#060913]">
          {/* Deep Cosmic Radial Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#040711] via-[#070d1d] to-[#0a122c] opacity-95" />
          <div className="absolute top-0 right-1/4 w-[650px] h-[650px] rounded-full bg-blue-900/15 blur-[160px]" />
          <div className="absolute bottom-10 left-10 w-[700px] h-[700px] rounded-full bg-indigo-950/20 blur-[180px]" />
          <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-purple-950/15 blur-[170px]" />

          {/* Gentle Distant Twinkling Stars */}
          <div className="absolute inset-0">
            {DARK_STARS.map((s) => (
              <div
                key={s.id}
                className="absolute rounded-full bg-slate-100 animate-gentle-twinkle"
                style={{
                  top: s.top,
                  left: s.left,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  boxShadow: "0 0 4px 1px rgba(255, 255, 255, 0.6)",
                  "--duration": s.duration,
                  "--delay": s.delay,
                }}
              />
            ))}
          </div>

          {/* Tiny Delicate Star Rain (Ngôi sao như mưa rơi nhỏ nhẹ, êm đềm) */}
          <div className="absolute inset-0 overflow-hidden">
            {TINY_STAR_RAIN.map((s) => (
              <div
                key={s.id}
                className="tiny-star-rain"
                style={{
                  top: s.top,
                  left: s.left,
                  width: `${s.length}px`,
                  animationDuration: s.duration,
                  animationDelay: s.delay,
                }}
              >
                <div className="tiny-star-head" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
