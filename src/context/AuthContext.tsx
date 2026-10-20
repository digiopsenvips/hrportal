'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Member, RoleType } from '@/types';
import { getPermissions, UserPermissions } from '@/lib/permissions';

interface AuthContextType {
  currentUser: Member | null;
  permissions: UserPermissions;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRoleMember: (memberId: string) => void;
  updateCurrentUserProfile: (updatedData: Partial<Member>) => Promise<boolean>;
  allMembers: Member[];
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setAllMembers(data);
        return data as Member[];
      }
    } catch (err) {
      console.error('Error loading members in AuthProvider:', err);
    }
    return [];
  };

  useEffect(() => {
    const initAuth = async () => {
      const members = await fetchMembers();
      const savedMemberId = typeof window !== 'undefined' ? localStorage.getItem('enactus_user_id') : null;

      if (savedMemberId) {
        const found = members.find((m) => m.id === savedMemberId);
        if (found) {
          setCurrentUser(found);
          setIsLoading(false);
          return;
        }
      }

      // Default to President so the user immediately experiences the full system capabilities
      if (members.length > 0) {
        const defaultUser = members.find((m) => m.role === 'president') || members[0];
        setCurrentUser(defaultUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('enactus_user_id', defaultUser.id);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/members');
      if (!res.ok) return { success: false, message: 'Failed to connect to authentication server' };

      const members: Member[] = await res.json();
      const user = members.find(
        (m) => m.email.toLowerCase() === email.toLowerCase() || m.memberId.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        return { success: false, message: 'No registered member found with this email or Member ID' };
      }

      setCurrentUser(user);
      localStorage.setItem('enactus_user_id', user.id);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Login error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('enactus_user_id');
    // Set to general member on logout or null
    const general = allMembers.find((m) => m.role === 'general_member') || null;
    setCurrentUser(general);
    if (general) {
      localStorage.setItem('enactus_user_id', general.id);
    }
  };

  const switchRoleMember = (memberId: string) => {
    const target = allMembers.find((m) => m.id === memberId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('enactus_user_id', target.id);
    }
  };

  const updateCurrentUserProfile = async (updatedData: Partial<Member>): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedData, id: currentUser.id }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCurrentUser(updated);
        setAllMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        return true;
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
    return false;
  };

  const refreshData = async () => {
    const members = await fetchMembers();
    if (currentUser) {
      const updated = members.find((m) => m.id === currentUser.id);
      if (updated) setCurrentUser(updated);
    }
  };

  const permissions = getPermissions(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        permissions,
        isLoading,
        login,
        logout,
        switchRoleMember,
        updateCurrentUserProfile,
        allMembers,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
