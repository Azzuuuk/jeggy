'use client';

import { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

const COLORS = ['#CCFF00', '#d9ff33', '#6366F1', '#818cf8', '#FF9F7C'];
const PARTICLE_COUNT = 50;
const DURATION = 2000;

export default function Confetti({ active, onComplete }: ConfettiProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active) {
      timerRef.current = setTimeout(() => {
        onComplete?.();
      }, DURATION);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, onComplete]);

  if (!active) return null;

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const left = Math.random() * 100;
    const color = COLORS[i % COLORS.length];
    const delay = Math.random() * 0.5;
    const swayAmount = (Math.random() - 0.5) * 60;
    const size = 4 + Math.random() * 6;
    const duration = 1.5 + Math.random() * 1;

    return (
      <div
        key={i}
        className="absolute top-0 rounded-sm opacity-0"
        style={{
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          animation: `confetti-fall ${duration}s ${delay}s ease-out forwards`,
          '--sway': `${swayAmount}px`,
        } as React.CSSProperties}
      />
    );
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(-10px) translateX(0) rotate(0deg);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) translateX(var(--sway)) rotate(720deg);
          }
        }
      `}</style>
      {particles}
    </div>
  );
}
