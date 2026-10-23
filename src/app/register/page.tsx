'use client';

import React from 'react';
import Link from 'next/link';
import ActiveMemberRegistrationForm from '@/components/members/ActiveMemberRegistrationForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#F7F9F7] px-4 py-8 sm:py-12 flex flex-col justify-between">
      {/* Top Bar for quick access */}
      <header className="max-w-6xl w-full mx-auto mb-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2FC3A5] text-[#263832] font-black text-lg shadow-sm transition group-hover:scale-105">
            E
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-[#263832]">TeamHub</span>
              <span className="rounded bg-[#FFC220]/20 px-1 py-0.2 text-[9px] font-black text-[#B45309]">
                ENACTUS
              </span>
            </div>
            <p className="text-[10px] text-[#82918B]">VIPS-TC HR Portal</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-xs text-[#82918B]">
          <span>Already have an account?</span>
          <Link
            href="/login"
            className="rounded-xl border border-[#E3EBE7] bg-white px-3 py-1.5 font-bold text-[#2FC3A5] hover:bg-[#DDF7EF]/50 transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Two-Column Active Member Registration Component */}
      <main className="flex-1 flex items-center justify-center">
        <ActiveMemberRegistrationForm />
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto mt-8 pt-6 border-t border-[#E3EBE7] text-center text-xs text-[#82918B]">
        <p>
          Enactus VIPS-TC &copy; {new Date().getFullYear()} &bull; Vivekananda Institute of Professional Studies - Technical Campus
        </p>
      </footer>
    </div>
  );
}
