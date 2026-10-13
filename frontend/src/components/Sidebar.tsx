'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, BarChart3, LogOut, ChevronRight, ChevronLeft, Building2, X
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  // Auto-close mobile drawer whenever route changes
  useEffect(() => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  }, [pathname]);

  // Lock body scroll on mobile when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Shared Nav links list
  const renderNavLinks = (isMobileDrawer = false) => (
    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        const showLabel = isMobileDrawer || !collapsed;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => {
              if (isMobileDrawer && onCloseMobile) onCloseMobile();
            }}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all group relative ${
              active
                ? 'bg-violet-600 text-white font-medium shadow-lg shadow-violet-600/25'
                : 'text-gray-400 hover:bg-gray-800/80 hover:text-white'
            }`}
          >
            <Icon size={19} className="shrink-0" />
            {showLabel && <span className="text-sm font-medium">{label}</span>}
            {showLabel && active && <ChevronRight size={15} className="ml-auto opacity-70" />}
            {!isMobileDrawer && collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {label}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );

  // Shared User section
  const renderUserSection = (isMobileDrawer = false) => {
    const showDetails = isMobileDrawer || !collapsed;
    return (
      <div className="border-t border-gray-800/80 p-3 bg-gray-900/50">
        {showDetails && (
          <div className="flex items-center gap-3 px-2 py-2.5 mb-1 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
              {user?.full_name?.charAt(0) || 'H'}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.full_name || 'HR Manager'}</p>
              <p className="text-gray-400 text-xs truncate">@{user?.username || 'admin'}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm font-medium cursor-pointer"
        >
          <LogOut size={17} className="shrink-0" />
          {showDetails && 'Log out'}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (Visible on md and above) */}
      <aside
        className={`hidden md:flex flex-col h-full bg-gray-900 border-r border-gray-800 shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Desktop Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800/80 h-16">
          {!collapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
                <Building2 size={18} className="text-white" />
              </div>
              <div className="truncate">
                <p className="text-white font-bold text-sm leading-tight tracking-tight">ACME Corp</p>
                <p className="text-gray-400 text-xs">Salary Management</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
              <Building2 size={18} className="text-white" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Desktop Nav */}
        {renderNavLinks(false)}

        {/* Desktop User Footer */}
        {renderUserSection(false)}
      </aside>

      {/* 2. MOBILE DRAWER OVERLAY (Visible on screens < md) */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          mobileOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
        }`}
      >
        {/* Dark Backdrop */}
        <div
          onClick={onCloseMobile}
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-out ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />

        {/* Slide-over Drawer */}
        <aside
          className={`absolute top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl transition-transform duration-300 ease-out z-10 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Header with Close Button */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/25">
                <Building2 size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">ACME Corp</p>
                <p className="text-gray-400 text-xs">Salary Management</p>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Nav Links */}
          {renderNavLinks(true)}

          {/* Mobile User Section */}
          {renderUserSection(true)}
        </aside>
      </div>
    </>
  );
}
