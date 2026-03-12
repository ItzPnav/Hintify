import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp, Theme } from '../../contexts/AppContext';

export function ThemeToggle() {
  const { theme, setTheme } = useApp();

  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
  ];

  return (
    <div className="flex items-center space-x-1 bg-soft-gray/20 rounded-lg p-1">
      {themes.map(({ value, icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
            transition-all duration-200 ease-in-out
            ${theme === value 
              ? 'bg-accent text-white shadow-sm' 
              : 'text-warm-gray dark:text-off-white hover:bg-soft-gray/30 hover:text-accent'
            }
          `}
          title={`Switch to ${label} theme`}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}