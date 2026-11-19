import { useEffect, useRef } from 'react';
import { AccentColorId, ThemeMode } from '../types/optimizer';
import { getAccentPreset } from '../utils/theme';

interface StarfieldBackgroundProps {
  themeMode: ThemeMode;
  accentColor: AccentColorId;
  enabled: boolean;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  accentTinted: boolean;
}

export function StarfieldBackground({
  themeMode,
  accentColor,
  enabled,
}: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const preset = getAccentPreset(accentColor);
    const isLight = themeMode === 'light';

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const starCount = Math.min(160, Math.max(85, Math.floor((width * height) / 11500)));
    const stars: Star[] = Array.from({ length: starCount }, (_, idx) => {
      const layer = idx % 3;
      const speedFactor = layer === 0 ? 0.12 : layer === 1 ? 0.24 : 0.42;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: layer === 0 ? 0.85 : layer === 1 ? 1.25 : 1.75,
        speedX: (Math.random() * 0.35 + 0.15) * speedFactor,
        speedY: (Math.random() * 0.45 + 0.25) * speedFactor,
        baseAlpha: layer === 0 ? 0.35 : layer === 1 ? 0.55 : 0.8,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.015 + Math.random() * 0.025,
        accentTinted: idx % 4 === 0,
      };
    });

    let animationId = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle radial accent nebula wash in top-right and bottom-left
      const g1 = ctx.createRadialGradient(
        width * 0.82,
        height * 0.14,
        0,
        width * 0.82,
        height * 0.14,
        Math.max(width, height) * 0.45
      );
      g1.addColorStop(0, `rgba(${preset.rgb}, ${isLight ? 0.24 : 0.18})`);
      g1.addColorStop(1, `rgba(${preset.rgb}, 0)`);
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const g2 = ctx.createRadialGradient(
        width * 0.15,
        height * 0.85,
        0,
        width * 0.15,
        height * 0.85,
        Math.max(width, height) * 0.4
      );
      g2.addColorStop(0, `rgba(${preset.rgb}, ${isLight ? 0.17 : 0.12})`);
      g2.addColorStop(1, `rgba(${preset.rgb}, 0)`);
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.speedX;
        s.y += s.speedY;
        s.twinklePhase += s.twinkleSpeed;

        if (s.x > width + 4) s.x = -4;
        if (s.y > height + 4) s.y = -4;

        const twinkle = 0.55 + 0.45 * Math.sin(s.twinklePhase);
        const alpha = s.baseAlpha * twinkle * (isLight ? 0.85 : 0.95);

        if (s.accentTinted) {
          ctx.fillStyle = `rgba(${preset.rgb}, ${Math.min(1, alpha * 1.1)})`;
        } else {
          ctx.fillStyle = isLight
            ? `rgba(30, 41, 59, ${alpha * 0.85})`
            : `rgba(241, 245, 249, ${alpha})`;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        if (s.radius > 1.5 && twinkle > 0.82) {
          ctx.fillStyle = s.accentTinted
            ? `rgba(${preset.rgb}, ${alpha * 0.28})`
            : isLight
              ? `rgba(30, 41, 59, ${alpha * 0.22})`
              : `rgba(255, 255, 255, ${alpha * 0.22})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [themeMode, accentColor, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
