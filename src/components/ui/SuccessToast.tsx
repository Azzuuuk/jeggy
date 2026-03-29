'use client';

import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  show: boolean;
  onDone?: () => void;
  duration?: number;
}

export default function SuccessToast({ message, show, onDone, duration = 2000 }: SuccessToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onDone]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100]" style={{ animation: 'toast-in 0.3s ease-out' }}>
      <div className="flex items-center gap-2.5 px-5 py-3 bg-accent-green/15 border border-accent-green/30 backdrop-blur-xl rounded-sm shadow-lg shadow-accent-green/10">
        <CheckCircle size={18} className="text-accent-green flex-shrink-0" />
        <span className="text-sm font-medium text-accent-green">{message}</span>
      </div>
    </div>
  );
}
