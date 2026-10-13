'use client';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search } from 'lucide-react';

export default function TopBar({ title }: { title: string }) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-white font-semibold text-lg">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            {user?.full_name?.charAt(0) || 'H'}
          </div>
          <div className="hidden sm:block">
            <p className="text-white text-sm font-medium">{user?.full_name || 'HR Manager'}</p>
            <p className="text-gray-400 text-xs">HR Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
