'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Network,
  FileText,
  Calendar,
  ClipboardCheck,
  CheckSquare,
  Trophy,
  Building2,
  Megaphone,
  Sliders,
  User,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, permissions } = useAuth();

  const navItems = [
    {
      label: 'Society Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      label: 'My Member Portal',
      href: '/member-dashboard',
      icon: User,
    },
    {
      label: 'Member Directory',
      href: '/members',
      icon: Users,
    },
    {
      label: 'Visual Organogram',
      href: '/organogram',
      icon: Network,
      highlight: true,
    },
    {
      label: 'Meeting Minutes (MOM)',
      href: '/moms',
      icon: FileText,
    },
    {
      label: 'Calendar & Meetings',
      href: '/calendar',
      icon: Calendar,
    },
    {
      label: 'Attendance & Quorum',
      href: '/attendance',
      icon: ClipboardCheck,
    },
    {
      label: 'HR Task Board',
      href: '/tasks',
      icon: CheckSquare,
    },
    {
      label: 'HR Leaderboard',
      href: '/leaderboard',
      icon: Trophy,
      badge: 'Weighted',
    },
    {
      label: 'Departments (8 Hubs)',
      href: '/departments',
      icon: Building2,
    },
    {
      label: 'Events & Notices',
      href: '/events',
      icon: Megaphone,
    },
    {
      label: 'Society Settings',
      href: '/settings',
      icon: Sliders,
      permission: permissions.canConfigureSocietySettings,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-slate-900/95 transition-all duration-300 md:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Top spacer or toggle */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide text-slate-300">
                ACTIVE PORTAL
              </span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {navItems.map((item) => {
            if (item.permission === false) return null;
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-400 font-semibold text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                  }`}
                />
                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-slate-950 text-amber-300'
                            : 'bg-amber-400/20 text-amber-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Current User Quick Info in Sidebar Footer */}
        <div className="border-t border-slate-800 p-3">
          <div
            className={`flex items-center gap-3 rounded-xl bg-slate-800/50 p-2.5 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser?.name || 'User'}
              className="h-8 w-8 rounded-full border border-amber-400/40 object-cover shrink-0"
            />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-white">
                  {currentUser?.name || 'Enactus Member'}
                </div>
                <div className="truncate text-[10px] text-amber-400">
                  {currentUser?.roleTitle || 'General Member'}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
