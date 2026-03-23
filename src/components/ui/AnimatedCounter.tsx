'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

export default function AnimatedCounter({ end, duration = 1000, suffix = '', decimals = 0 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const prevEnd = useRef(end);
  const animating = useRef(false);

  useEffect(() => {
    // Skip if value hasn't changed or already animating to this value
    if (end === prevEnd.current && animating.current) return;
    prevEnd.current = end;

    if (end === 0) {
      setCount(0);
      return;
    }

    const animate = () => {
      animating.current = true;
      const start = performance.now();
      const startVal = 0;

      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(startVal + eased * (end - startVal));
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          animating.current = false;
        }
      };

      requestAnimationFrame(tick);
    };

    // If element is already visible or IntersectionObserver not needed, animate directly
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString();

  return <span ref={ref}>{display}{suffix}</span>;
}
