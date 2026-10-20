'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const res = await login(email, password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Invalid credentials');
    }
  };

  const handleQuickDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9F7] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#2FC3A5] text-[#263832] font-black text-2xl shadow-sm mb-3">
            E
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-[#263832]">ENACTUS</h1>
            <span className="rounded-md bg-[#FFC220]/20 px-2 py-0.5 text-xs font-black text-[#B45309]">
              VIPS-TC
            </span>
          </div>
          <p className="mt-1 text-xs text-[#60736C]">
            Central HR Management & Operations Portal
          </p>
        </div>

        {/* TeamHub Login Card */}
        <div className="rounded-3xl border border-[#E3EBE7] bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#263832]">Sign in to your account</h2>
            <p className="mt-1 text-xs text-[#60736C]">
              Enter your credentials to access your society dashboard
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Continue with Google */}
          <button
            type="button"
            onClick={() => alert('Google OAuth: In development environment, please configure GOOGLE_CLIENT_ID or use Email sign-in with pre-seeded demo accounts below.')}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#E3EBE7] bg-white px-4 py-2.5 text-xs font-bold text-[#263832] hover:bg-[#DDF7EF] transition shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E3EBE7]" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-semibold text-[#60736C]">
              or sign in with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#263832]">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#60736C]" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hr.admin@enactusvips.org"
                  className="w-full rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] pl-10 pr-4 py-2.5 text-xs text-[#263832] placeholder-[#60736C] focus:border-[#2FC3A5] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#263832]">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#60736C]" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] pl-10 pr-10 py-2.5 text-xs text-[#263832] placeholder-[#60736C] focus:border-[#2FC3A5] focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#60736C] hover:text-[#263832]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2FC3A5] py-2.5 text-xs font-bold text-[#263832] hover:bg-[#26B396] shadow-sm transition"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign in to Portal'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Demo Accounts Quick-Fill Box for Testing */}
          <div className="mt-6 rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-[#263832] mb-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2FC3A5]" />
              <span>Development Demo Credentials (Password: Admin@123):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoFill('hr.admin@enactusvips.org')}
                className="rounded-lg bg-white border border-[#E3EBE7] px-2 py-1 text-[10px] font-semibold text-[#263832] hover:bg-[#DDF7EF]"
              >
                HR Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('president@enactusvips.org')}
                className="rounded-lg bg-white border border-[#E3EBE7] px-2 py-1 text-[10px] font-semibold text-[#263832] hover:bg-[#DDF7EF]"
              >
                President
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('member@enactusvips.org')}
                className="rounded-lg bg-white border border-[#E3EBE7] px-2 py-1 text-[10px] font-semibold text-[#263832] hover:bg-[#DDF7EF]"
              >
                General Member
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-[#60736C]">
            New member applicant?{' '}
            <Link href="/register" className="font-bold text-[#2FC3A5] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
