'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import {
  Bell,
  Search,
  UserCheck,
  ChevronDown,
  LogOut,
  User,
  Sliders,
  Check,
  Menu,
  ShieldAlert,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenSearch: () => void;
}

export function Navbar({ onToggleSidebar, onOpenSearch }: NavbarProps) {
  const { currentUser, switchRoleMember, allMembers, logout } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userNotifications = notifications.filter(
    (n) => !currentUser || n.recipientMemberId === currentUser.id
  );
  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  // Filter key role archetypes for convenient 1-click role preview
  const keyRoles = [
    { title: 'Level 1: President', role: 'president' },
    { title: 'Level 2: VP 1 (Operations)', role: 'vp_1' },
    { title: 'Level 2: VP 2 (PR & External)', role: 'vp_2' },
    { title: 'Level 2: VP 3 (Strategy)', role: 'vp_3' },
    { title: 'Level 3: General Secretary', role: 'secretary' },
    { title: 'Level 4: HR Department Head', role: 'hr_head' },
    { title: 'Level 5: Digital Operations Head', role: 'dept_head' },
    { title: 'Level 6: Secondary HR (Digital)', role: 'secondary_hr' },
    { title: 'Level 7: General Member', role: 'general_member' },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 backdrop-blur-md md:px-6">
      {/* Left: Mobile Menu toggle + Branding */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 font-black text-slate-950 shadow-md shadow-amber-500/20">
            E
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-white">
              <span>ENACTUS</span>
              <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-400">
                VIPS-TC
              </span>
            </div>
            <div className="text-[10px] font-medium text-slate-400">
              Operations & HR Management
            </div>
          </div>
        </Link>
      </div>

      {/* Center: Global Search Bar Trigger */}
      <div className="hidden max-w-md flex-1 px-8 md:block">
        <button
          onClick={onOpenSearch}
          className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 px-3.5 py-2 text-sm text-slate-400 shadow-inner transition hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-amber-400" />
            <span>Search members, meetings, MOMs, tasks...</span>
          </div>
          <kbd className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-slate-400">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right: Role Switcher preview, Notifications, User profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Search button */}
        <button
          onClick={onOpenSearch}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          title="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Quick Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotifMenu(false);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
            title="Switch Persona / Role Tier to test RBAC"
          >
            <UserCheck className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Role:</span>
            <span className="max-w-[120px] truncate font-bold text-white">
              {currentUser?.roleTitle || 'Guest'}
            </span>
            <ChevronDown className="h-3 w-3 text-amber-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl shadow-black ring-1 ring-black/50">
              <div className="border-b border-slate-800 px-3 py-2">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Switch Active Persona
                </div>
                <div className="text-[11px] text-slate-400">
                  Test role-based permissions across all 7 society hierarchy levels.
                </div>
              </div>
              <div className="max-h-72 space-y-1 overflow-y-auto py-2">
                {keyRoles.map((kr) => {
                  const targetMember = allMembers.find((m) => m.role === kr.role);
                  const isCurrent = currentUser?.role === kr.role;
                  if (!targetMember) return null;
                  return (
                    <button
                      key={kr.role}
                      onClick={() => {
                        switchRoleMember(targetMember.id);
                        setShowRoleMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                        isCurrent
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{kr.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {targetMember.name} • {targetMember.memberId}
                        </div>
                      </div>
                      {isCurrent && <Check className="h-4 w-4 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowRoleMenu(false);
              setShowUserMenu(false);
            }}
            className="relative rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm shadow-rose-500/50">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl shadow-black sm:w-96">
              <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                <span className="text-xs font-bold text-white">Notifications</span>
                {currentUser && unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead(currentUser.id)}
                    className="text-[11px] font-medium text-amber-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 space-y-1.5 overflow-y-auto p-2">
                {userNotifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  userNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`cursor-pointer rounded-lg border p-2.5 transition ${
                        n.isRead
                          ? 'border-slate-800 bg-slate-900/40 text-slate-400'
                          : 'border-amber-500/30 bg-amber-500/5 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-amber-400">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowRoleMenu(false);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-slate-800"
          >
            <img
              src={
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
              }
              alt={currentUser?.name || 'User'}
              className="h-8 w-8 rounded-full border border-amber-400/50 object-cover"
            />
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl shadow-black">
              <div className="border-b border-slate-800 px-3 py-2.5">
                <div className="font-semibold text-white">{currentUser?.name}</div>
                <div className="text-xs text-slate-400">{currentUser?.email}</div>
                <div className="mt-1.5 inline-flex items-center rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                  {currentUser?.roleTitle}
                </div>
              </div>
              <div className="py-1">
                <Link
                  href="/member-dashboard"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <User className="h-4 w-4 text-amber-400" />
                  <span>My Personal Dashboard</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Sliders className="h-4 w-4 text-amber-400" />
                  <span>Society & Portal Settings</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Switch / Reset Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
