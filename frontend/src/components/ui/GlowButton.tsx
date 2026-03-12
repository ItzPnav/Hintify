import React from 'react';

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function GlowButton({ 
  children, 
  onClick, 
  disabled = false, 
  type = 'button',
  variant = 'primary',
  className = ''
}: GlowButtonProps) {
  const baseClasses = `
    px-8 py-3 rounded-lg font-medium transition-all duration-300 ease-in-out
    transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
    disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

  const variantClasses = variant === 'primary' 
    ? `
      bg-accent text-white hover:bg-accent/90 
      shadow-[0_0_20px_rgba(235,94,40,0.3)] hover:shadow-[0_0_30px_rgba(235,94,40,0.5)]
      focus:ring-accent/50
    `
    : `
      bg-warm-gray text-off-white hover:bg-warm-gray/90
      shadow-[0_0_20px_rgba(64,61,57,0.3)] hover:shadow-[0_0_30px_rgba(64,61,57,0.5)]
      focus:ring-warm-gray/50
    `;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
}