'use client';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Menu } from 'lucide-react';

interface TopBarProps {
  title: string;
  onOpenMobileMenu?: () => void;
}

export default function TopBar({ title, onOpenMobileMenu }: TopBarProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 -ml-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-white font-semibold text-base sm:text-lg truncate tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right: Notifications + User avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full ring-2 ring-gray-900"></span>
        </button>

        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-gray-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
            {user?.full_name?.charAt(0) || 'H'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-white text-xs sm:text-sm font-medium leading-tight truncate max-w-[140px]">
              {user?.full_name || 'HR Manager'}
            </p>
            <p className="text-gray-400 text-[11px] leading-tight">HR Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
