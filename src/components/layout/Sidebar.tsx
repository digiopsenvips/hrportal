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
  UserPlus,
  ShieldCheck,
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
      label: 'HR Dashboard',
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
      label: 'Member Management',
      href: '/members',
      icon: Users,
    },
    {
      label: 'Visual Organogram',
      href: '/organogram',
      icon: Network,
    },
    {
      label: 'MoM & Attendance',
      href: '/moms',
      icon: FileText,
      badge: 'Integrated',
    },
    {
      label: 'Meetings & Calendar',
      href: '/calendar',
      icon: Calendar,
    },
    {
      label: 'Task Management',
      href: '/tasks',
      icon: CheckSquare,
    },
    {
      label: 'Society Leaderboard',
      href: '/leaderboard',
      icon: Trophy,
    },
    {
      label: 'Departments (8 Hubs)',
      href: '/departments',
      icon: Building2,
    },
    {
      label: 'Audit Log',
      href: '/audit',
      icon: ShieldCheck,
      permission: permissions.canAccessAuditLogs,
    },
    {
      label: 'Notices & Events',
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
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#E3EBE7] bg-white transition-all duration-300 md:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#E3EBE7]">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#2FC3A5]" />
              <span className="text-xs font-black tracking-wider text-[#263832] uppercase">
                TEAMHUB HR PORTAL
              </span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] text-[#60736C] hover:bg-[#DDF7EF] hover:text-[#263832]"
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
                className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#2FC3A5] text-[#263832] shadow-sm font-bold'
                    : 'text-[#263832] hover:bg-[#DDF7EF] hover:text-[#064A31]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive ? 'text-[#263832]' : 'text-[#60736C] group-hover:text-[#2FC3A5]'
                  }`}
                />
                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider ${
                          isActive
                            ? 'bg-white text-[#263832]'
                            : 'bg-[#E7F3D7] text-[#064A31]'
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

        {/* User Card in Footer */}
        <div className="border-t border-[#E3EBE7] p-3">
          <div
            className={`flex items-center gap-3 rounded-2xl bg-[#F7F9F7] p-2.5 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser?.name || 'User'}
              className="h-8 w-8 rounded-full border border-[#E3EBE7] object-cover shrink-0"
            />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-[#263832]">
                  {currentUser?.name || 'Enactus Member'}
                </div>
                <div className="truncate text-[10px] text-[#60736C]">
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
