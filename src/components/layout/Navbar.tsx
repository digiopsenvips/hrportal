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

  const keyRoles = [
    { title: 'Level 1: President', role: 'president' },
    { title: 'Level 2: VP 1 (Operations)', role: 'vp_1' },
    { title: 'Level 3: General Secretary', role: 'secretary' },
    { title: 'Level 4: HR Department Head', role: 'hr_head' },
    { title: 'Level 5: Digital Operations Head', role: 'dept_head' },
    { title: 'Level 6: Secondary HR (Digital)', role: 'secondary_hr' },
    { title: 'Level 7: General Member', role: 'general_member' },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#E3EBE7] bg-white px-4 md:px-6 shadow-sm">
      {/* Left: Mobile Menu toggle + Branding */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-[#60736C] hover:bg-[#DDF7EF] hover:text-[#263832] md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2FC3A5] font-black text-[#263832] shadow-sm">
            E
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-[#263832]">
              <span>ENACTUS</span>
              <span className="rounded bg-[#FFC220]/20 px-1.5 py-0.2 text-[10px] font-black text-[#B45309]">
                VIPS-TC
              </span>
            </div>
            <div className="text-[10px] font-medium text-[#60736C]">
              Operations & HR Portal
            </div>
          </div>
        </Link>
      </div>

      {/* Center: Global Search Bar Trigger */}
      <div className="hidden max-w-md flex-1 px-8 md:block">
        <button
          onClick={onOpenSearch}
          className="flex w-full items-center justify-between rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] px-3.5 py-2 text-xs text-[#60736C] transition hover:border-[#2FC3A5] hover:bg-white"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[#2FC3A5]" />
            <span>Search members, meetings, MoMs, tasks...</span>
          </div>
          <kbd className="rounded border border-[#E3EBE7] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#60736C]">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Search button */}
        <button
          onClick={onOpenSearch}
          className="rounded-lg p-2 text-[#60736C] hover:bg-[#DDF7EF] md:hidden"
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
            className="flex items-center gap-1.5 rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-2.5 py-1.5 text-xs font-semibold text-[#263832] hover:bg-[#DDF7EF] transition"
          >
            <UserCheck className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span className="hidden sm:inline text-[#60736C]">Role:</span>
            <span className="max-w-[120px] truncate font-bold text-[#263832]">
              {currentUser?.roleTitle || 'Guest'}
            </span>
            <ChevronDown className="h-3 w-3 text-[#60736C]" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#E3EBE7] bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
              <div className="border-b border-[#E3EBE7] px-3 py-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#064A31]">
                  Switch Active Persona
                </div>
                <div className="text-[10px] text-[#60736C]">
                  Test role-based permissions across society levels.
                </div>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto py-2">
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
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                        isCurrent
                          ? 'bg-[#E7F3D7] text-[#064A31] font-bold'
                          : 'text-[#263832] hover:bg-[#F7F9F7]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{kr.title}</div>
                        <div className="text-[10px] text-[#60736C]">
                          {targetMember.name} • {targetMember.memberId}
                        </div>
                      </div>
                      {isCurrent && <Check className="h-4 w-4 text-[#064A31]" />}
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
            className="relative rounded-xl p-2 text-[#60736C] hover:bg-[#DDF7EF] hover:text-[#263832] transition"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#2FC3A5] px-1 text-[10px] font-bold text-[#263832]">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E3EBE7] bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 sm:w-96">
              <div className="flex items-center justify-between border-b border-[#E3EBE7] px-3 py-2">
                <span className="text-xs font-bold text-[#263832]">Notifications</span>
                {currentUser && unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead(currentUser.id)}
                    className="text-[11px] font-semibold text-[#2FC3A5] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 space-y-1.5 overflow-y-auto p-2">
                {userNotifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#60736C]">
                    No notifications yet.
                  </div>
                ) : (
                  userNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`cursor-pointer rounded-xl border p-2.5 transition ${
                        n.isRead
                          ? 'border-[#E3EBE7] bg-white text-[#60736C]'
                          : 'border-[#2FC3A5]/40 bg-[#DDF7EF]/40 text-[#263832]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-[#064A31]">{n.title}</span>
                        <span className="text-[10px] text-[#60736C]">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#263832]">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowRoleMenu(false);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2 rounded-2xl p-1 hover:bg-[#DDF7EF] transition"
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser?.name || 'User'}
              className="h-8 w-8 rounded-full border border-[#E3EBE7] object-cover"
            />
            <ChevronDown className="hidden h-3.5 w-3.5 text-[#60736C] sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#E3EBE7] bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
              <div className="border-b border-[#E3EBE7] px-3 py-2.5">
                <div className="font-bold text-[#263832]">{currentUser?.name}</div>
                <div className="text-xs text-[#60736C]">{currentUser?.email}</div>
                <div className="mt-1.5 inline-flex items-center rounded-full bg-[#E7F3D7] px-2 py-0.5 text-[10px] font-bold text-[#064A31]">
                  {currentUser?.roleTitle}
                </div>
              </div>
              <div className="py-1">
                <Link
                  href="/member-dashboard"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#263832] hover:bg-[#DDF7EF]"
                >
                  <User className="h-4 w-4 text-[#2FC3A5]" />
                  <span>My Personal Dashboard</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#263832] hover:bg-[#DDF7EF]"
                >
                  <Sliders className="h-4 w-4 text-[#2FC3A5]" />
                  <span>Society Settings</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
