'use client';

import React, { useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { GlobalSearchModal } from '@/components/common/GlobalSearchModal';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <AuthProvider>
      <DataProvider>
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100 antialiased selection:bg-amber-400 selection:text-slate-950">
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
      </DataProvider>
    </AuthProvider>
  );
}
