import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Edit3, Image, Settings, LogOut } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ThemeToggle } from '../ui/ThemeToggle';

export function Header() {
  const { user, logout } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { icon: <Edit3 className="w-4 h-4" />, label: 'Edit Name', action: () => {} },
    { icon: <Image className="w-4 h-4" />, label: 'Change Profile Picture', action: () => {} },
    { icon: <Settings className="w-4 h-4" />, label: 'Settings', action: () => {} },
  ];

  return (
    <header className="bg-white/80 dark:bg-dark-tone/80 backdrop-blur-sm border-b border-soft-gray/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <h1 className="text-2xl font-bold text-warm-gray dark:text-off-white">
              Hintify
            </h1>
          </div>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-soft-gray/20 transition-colors"
            >
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:block text-warm-gray dark:text-off-white font-medium">
                {user?.username}
              </span>
              <ChevronDown className={`w-4 h-4 text-warm-gray dark:text-off-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-dark-tone rounded-lg shadow-lg border border-soft-gray/20 py-2">
                <div className="px-4 py-3 border-b border-soft-gray/20">
                  <p className="text-sm font-medium text-warm-gray dark:text-off-white">{user?.username}</p>
                  <p className="text-xs text-soft-gray">{user?.email}</p>
                </div>
                
                <div className="px-4 py-3 border-b border-soft-gray/20">
                  <p className="text-xs text-warm-gray dark:text-off-white mb-2">Theme</p>
                  <ThemeToggle />
                </div>

                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-warm-gray dark:text-off-white hover:bg-soft-gray/10 transition-colors"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}

                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}