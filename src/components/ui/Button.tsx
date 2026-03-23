import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants: Record<string, string> = {
    primary: 'bg-accent-orange text-black hover:bg-accent-orange-hover active:scale-[0.97]',
    secondary: 'bg-accent-teal text-white hover:bg-accent-teal-hover active:scale-[0.97]',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
    outline: 'border border-border text-text-secondary hover:text-text-primary hover:border-border-light bg-transparent',
    danger: 'bg-danger text-white hover:bg-red-600 active:scale-[0.97]',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
