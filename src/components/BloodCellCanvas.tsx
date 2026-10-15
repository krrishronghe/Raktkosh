"use client";

import { useEffect, useRef } from "react";

interface Cell3D {
  x: number;
  y: number;
  z: number; // depth: 0.2 (distant) to 1.4 (foreground)
  radius: number;
  rotation: number; // in radians
  rotationSpeed: number;
  tilt: number; // inclination angle
  tiltSpeed: number;
  vx: number;
  vy: number;
  pulsePhase: number;
}

export default function BloodCellCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates for 3D parallax depth
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);

    // Generate 3D floating erythrocytes (red blood cells)
    const CELL_COUNT = Math.min(26, Math.max(14, Math.floor(width / 75)));
    const cells: Cell3D[] = [];

    for (let i = 0; i < CELL_COUNT; i++) {
      cells.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.3 + Math.random() * 1.1, // depth layering
        radius: 18 + Math.random() * 26,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.008,
        tilt: Math.random() * Math.PI * 2,
        tiltSpeed: (Math.random() - 0.5) * 0.006,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -0.2 - Math.random() * 0.35, // gentle upward floating drift
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Draw realistic 3D biconcave erythrocyte disc with lighting
    const renderCell = (
      c: Cell3D,
      parallaxX: number,
      parallaxY: number,
      isDark: boolean
    ) => {
      ctx.save();

      // Apply 3D perspective translation
      const posX = c.x + parallaxX * (c.z * 18);
      const posY = c.y + parallaxY * (c.z * 18);
      const effectiveRadius = c.radius * c.z;

      ctx.translate(posX, posY);
      ctx.rotate(c.rotation);

      // Squish horizontally based on tilt to simulate 3D planar rotation
      const aspect = Math.max(0.35, Math.abs(Math.cos(c.tilt)));
      ctx.scale(1, aspect);

      // Outer Glow & Shadow
      ctx.shadowBlur = isDark ? 20 * c.z : 12 * c.z;
      ctx.shadowColor = isDark
        ? "rgba(229, 9, 20, 0.45)"
        : "rgba(184, 29, 36, 0.25)";

      // Outer rim gradient (smooth rounded toroidal surface)
      const rimGrad = ctx.createRadialGradient(
        -effectiveRadius * 0.2,
        -effectiveRadius * 0.2,
        effectiveRadius * 0.1,
        0,
        0,
        effectiveRadius
      );

      if (isDark) {
        rimGrad.addColorStop(0, "#FF4D56"); // Specular highlight on upper curve
        rimGrad.addColorStop(0.35, "#E50914"); // Primary crimson
        rimGrad.addColorStop(0.7, "#990B12"); // Deep blood shadow
        rimGrad.addColorStop(1, "#54060A"); // Dark occlusion boundary
      } else {
        rimGrad.addColorStop(0, "#FF6B72");
        rimGrad.addColorStop(0.35, "#E50914");
        rimGrad.addColorStop(0.75, "#B81D24");
        rimGrad.addColorStop(1, "#800F15");
      }

      ctx.beginPath();
      ctx.arc(0, 0, effectiveRadius, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();

      // Inner Biconcave Dimple (The iconic concave depression of red blood cells)
      const concavityRadius = effectiveRadius * 0.46;
      const dimpleGrad = ctx.createRadialGradient(
        effectiveRadius * 0.1,
        effectiveRadius * 0.1,
        concavityRadius * 0.05,
        0,
        0,
        concavityRadius
      );

      if (isDark) {
        dimpleGrad.addColorStop(0, "rgba(40, 2, 5, 0.95)"); // Deep recessed core
        dimpleGrad.addColorStop(0.6, "rgba(120, 10, 16, 0.85)");
        dimpleGrad.addColorStop(1, "rgba(180, 15, 22, 0)");
      } else {
        dimpleGrad.addColorStop(0, "rgba(90, 8, 12, 0.85)");
        dimpleGrad.addColorStop(0.6, "rgba(150, 12, 18, 0.7)");
        dimpleGrad.addColorStop(1, "rgba(229, 9, 20, 0)");
      }

      ctx.beginPath();
      ctx.arc(0, 0, concavityRadius, 0, Math.PI * 2);
      ctx.fillStyle = dimpleGrad;
      ctx.fill();

      // Subtle specular glass-like glint on upper rim
      ctx.beginPath();
      ctx.ellipse(
        -effectiveRadius * 0.35,
        -effectiveRadius * 0.35,
        effectiveRadius * 0.32,
        effectiveRadius * 0.14,
        Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = isDark
        ? "rgba(255, 255, 255, 0.35)"
        : "rgba(255, 255, 255, 0.5)";
      ctx.fill();

      ctx.restore();
    };

    const animate = () => {

      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      const normMouseX = (mouseX / width - 0.5) * 2;
      const normMouseY = (mouseY / height - 0.5) * 2;

      const isDark = document.documentElement.classList.contains("dark");

      ctx.clearRect(0, 0, width, height);

      // Sort cells by Z depth so foreground occludes background realistically
      cells.sort((a, b) => a.z - b.z);

      // Update and render each cell
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];

        c.x += c.vx * c.z;
        c.y += c.vy * c.z;
        c.rotation += c.rotationSpeed;
        c.tilt += c.tiltSpeed;
        c.pulsePhase += 0.02;

        // Wrap around viewport edges smoothly
        const pad = c.radius * 2;
        if (c.y < -pad) c.y = height + pad;
        if (c.y > height + pad) c.y = -pad;
        if (c.x < -pad) c.x = width + pad;
        if (c.x > width + pad) c.x = -pad;

        renderCell(c, normMouseX, normMouseY, isDark);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-0 opacity-20 dark:opacity-45 transition-opacity duration-700 ${className}`}
      aria-hidden="true"
    />
  );
}
