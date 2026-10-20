'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Clock, ShieldAlert, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function PendingApprovalPage() {
  const { currentUser, logout, refreshData } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9F7] px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-[#E7F3D7] text-[#064A31] mb-4 shadow-sm">
          <Clock className="h-8 w-8 text-[#2FC3A5]" />
        </div>

        <h1 className="text-2xl font-black text-[#263832]">Membership Application Pending</h1>
        <p className="mt-2 text-xs md:text-sm text-[#60736C]">
          Thank you for applying to Enactus VIPS-TC, <strong>{currentUser?.name || 'Applicant'}</strong>.
        </p>

        <div className="mt-6 rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-sm text-left text-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-[#2FC3A5] shrink-0 mt-0.5" />
            <span className="text-[#263832]">
              Registration submitted and account record generated ({currentUser?.memberId || 'ENVIPS-PENDING'}).
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="text-[#60736C]">
              In accordance with society governance policy, an HR Administrator or Head of Department must review and approve your credentials before portal access is unlocked.
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E3EBE7] text-[11px] text-[#60736C]">
            Status: <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Pending Review</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => refreshData()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-[#E3EBE7] bg-white px-5 py-2.5 text-xs font-bold text-[#263832] hover:bg-[#DDF7EF] transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Check Approval Status</span>
          </button>

          <button
            onClick={() => logout()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[#2FC3A5] px-5 py-2.5 text-xs font-bold text-[#263832] hover:bg-[#26B396] shadow-sm transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
