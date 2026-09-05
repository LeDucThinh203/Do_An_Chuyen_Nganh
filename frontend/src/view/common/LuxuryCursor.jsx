// src/view/common/LuxuryCursor.jsx
import React, { useEffect, useRef } from "react";

export default function LuxuryCursor() {
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Disable on touch / mobile devices
    if (typeof window === "undefined" || !window.matchMedia("(hover: hover)").matches) {
      return;
    }

    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    const canvas = canvasRef.current;
    if (!dot || !ring || !canvas) return;

    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse coordinates
    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isHovering = false;
    let isClicking = false;

    // Particle pool for bubble sparkles
    const particles = [];
    const MAX_PARTICLES = 50;

    const colors = [
      "rgba(56, 189, 248, ",   // Cyan
      "rgba(129, 140, 248, ",  // Indigo
      "rgba(251, 191, 36, ",   // Amber gold
      "rgba(244, 114, 182, ",  // Rose
      "rgba(255, 255, 255, ",  // Diamond white
    ];

    const createParticle = (x, y, isBurst = false) => {
      if (particles.length >= MAX_PARTICLES) return;
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      const angle = isBurst ? Math.random() * Math.PI * 2 : Math.random() * Math.PI * 2;
      const speed = isBurst ? Math.random() * 2.5 + 1 : Math.random() * 1.2 + 0.3;

      particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isBurst ? 0.3 : 0.6), // Gentle upward drift
        size: Math.random() * (isBurst ? 5 : 4) + 2.5,
        color: baseColor,
        alpha: 0.85,
        decay: Math.random() * 0.02 + 0.015,
        isStar: Math.random() > 0.65,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
      });
    };

    let lastSpawnTime = 0;
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

      // Check if hovering interactive elements
      const target = e.target;
      if (
        target &&
        (target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("select") ||
          target.closest("textarea") ||
          target.closest('[role="button"]') ||
          target.classList.contains("cursor-pointer") ||
          window.getComputedStyle(target).cursor === "pointer")
      ) {
        isHovering = true;
      } else {
        isHovering = false;
      }

      // Spawn bubble trail throttled
      const now = performance.now();
      if (now - lastSpawnTime > 30) {
        createParticle(mouseX, mouseY, false);
        lastSpawnTime = now;
      }
    };

    const handleMouseDown = () => {
      isClicking = true;
      // Burst 6 tiny sparkling bubbles on click
      for (let i = 0; i < 6; i++) {
        createParticle(mouseX, mouseY, true);
      }
    };

    const handleMouseUp = () => {
      isClicking = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // Draw 4-point star sparkle
    const drawStar = (x, y, radius, color, alpha) => {
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = `${color}${alpha})`;
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(Math.cos(((1 + i * 2) * Math.PI) / 4) * radius + x, Math.sin(((1 + i * 2) * Math.PI) / 4) * radius + y);
        ctx.lineTo(Math.cos(((2 + i * 2) * Math.PI) / 4) * (radius * 0.3) + x, Math.sin(((2 + i * 2) * Math.PI) / 4) * (radius * 0.3) + y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Animation Loop
    let animId;
    const render = () => {
      // Smooth lerp for ring
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;

      const scale = isClicking ? 0.8 : isHovering ? 1.5 : 1;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(${scale})`;

      if (isHovering) {
        ring.classList.add("cursor-ring-active");
      } else {
        ring.classList.remove("cursor-ring-active");
      }

      // Render bubble sparkles canvas
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.size *= 0.985;
        p.rotation += p.rotationSpeed;

        if (p.alpha <= 0 || p.size <= 0.5) {
          particles.splice(i, 1);
          continue;
        }

        if (p.isStar) {
          drawStar(p.x, p.y, p.size * 1.5, p.color, p.alpha);
        } else {
          // Shimmering bubble with delicate highlight ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha * 0.35})`;
          ctx.fill();

          ctx.strokeStyle = `${p.color}${p.alpha * 0.85})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Bubble inner glint
          ctx.beginPath();
          ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.9})`;
          ctx.fill();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <>
      {/* Interactive Bubble Sparkles Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[99998]"
        aria-hidden="true"
      />

      {/* Luxury Center Precision Dot */}
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full pointer-events-none z-[999999] transition-opacity duration-200 hidden md:block"
        style={{
          backgroundColor: "#38bdf8",
          boxShadow: "0 0 8px #38bdf8, 0 0 16px rgba(56, 189, 248, 0.8), 0 0 2px #ffffff",
          willChange: "transform",
        }}
      />

      {/* Luxury Trailing Ring */}
      <div
        ref={cursorRingRef}
        className="fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full pointer-events-none z-[999998] transition-all duration-150 ease-out hidden md:block"
        style={{
          border: "1.5px solid rgba(56, 189, 248, 0.45)",
          backgroundColor: "rgba(56, 189, 248, 0.04)",
          boxShadow: "0 0 12px rgba(56, 189, 248, 0.2)",
          willChange: "transform",
        }}
      />
    </>
  );
}
