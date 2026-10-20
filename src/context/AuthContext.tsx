'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Member } from '@/types';
import { getPermissions, UserPermissions } from '@/lib/permissions';

interface AuthContextType {
  currentUser: Member | null;
  permissions: UserPermissions;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (payload: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRoleMember: (memberId: string) => void;
  updateCurrentUserProfile: (updatedData: Partial<Member>) => Promise<boolean>;
  allMembers: Member[];
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
          // Check approval and membership status
          if (found.approvalStatus === 'PENDING') {
            setCurrentUser(found);
            setIsLoading(false);
            if (pathname !== '/pending-approval') router.push('/pending-approval');
            return;
          }
          if (found.membershipStatus === 'ACTIVE') {
            setCurrentUser(found);
            setIsLoading(false);
            return;
          }
        }
      }

      // No valid active session
      setCurrentUser(null);
      setIsLoading(false);

      const publicPaths = ['/login', '/register', '/pending-approval'];
      if (!publicPaths.includes(pathname)) {
        router.push('/login');
      }
    };

    initAuth();
  }, [pathname, router]);

  const login = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'APPROVAL_PENDING') {
          localStorage.setItem('enactus_user_id', data.user.id);
          router.push('/pending-approval');
          return { success: false, message: data.message };
        }
        return { success: false, message: data.error || 'Authentication failed' };
      }

      setCurrentUser(data.user);
      localStorage.setItem('enactus_user_id', data.user.id);
      await fetchMembers();
      router.push('/dashboard');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Login error' };
    }
  };

  const register = async (payload: any) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Registration failed' };
      }

      localStorage.setItem('enactus_user_id', data.user.id);
      router.push('/pending-approval');
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('enactus_user_id');
    setCurrentUser(null);
    router.push('/login');
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
        register,
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
