'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { GlobalSearchModal } from '@/components/common/GlobalSearchModal';

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // If on login, register, or pending-approval page, render clean standalone view without app shell
  const isAuthPage = ['/login', '/register', '/pending-approval'].includes(pathname);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9F7] text-[#263832]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2FC3A5] border-t-transparent" />
          <span className="text-xs font-bold text-[#60736C]">Loading Enactus VIPS-TC Portal...</span>
        </div>
      </div>
    );
  }

  if (isAuthPage || !currentUser) {
    return <main className="min-h-screen bg-[#F7F9F7] text-[#263832]">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9F7] font-sans text-[#263832] antialiased selection:bg-[#2FC3A5] selection:text-[#263832]">
      <Navbar
        onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent>{children}</AppContent>
      </DataProvider>
    </AuthProvider>
  );
}
