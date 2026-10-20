'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { User, Mail, Lock, Building2, Phone, ArrowRight, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { departments } = useData();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'digital-operations');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [phone, setPhone] = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const res = await register({
      name,
      email,
      password,
      departmentId,
      branch,
      phone,
      collegeEnrollment: enrollment,
    });
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9F7] px-4 py-12">
      <div className="w-full max-w-lg">
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
            Member Registration & Onboarding
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-3xl border border-[#E3EBE7] bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#263832]">Apply for Society Membership</h2>
            <p className="mt-1 text-xs text-[#60736C]">
              New applications require approval from the HR Administration team before portal access is granted.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#263832]">Full Name *</label>
              <div className="relative mt-1">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-[#60736C]" />
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohini Sen"
                  className="w-full rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] pl-10 pr-4 py-2.5 text-xs text-[#263832] placeholder-[#60736C] focus:border-[#2FC3A5] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#263832]">Email Address *</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#60736C]" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rohini@vips.edu"
                  className="w-full rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] pl-10 pr-4 py-2.5 text-xs text-[#263832] placeholder-[#60736C] focus:border-[#2FC3A5] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#263832]">Password *</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#60736C]" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] pl-10 pr-4 py-2.5 text-xs text-[#263832] placeholder-[#60736C] focus:border-[#2FC3A5] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Confirm Password *</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#60736C]" />
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] pl-10 pr-4 py-2.5 text-xs text-[#263832] placeholder-[#60736C] focus:border-[#2FC3A5] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#263832]">Primary Department</label>
                <div className="relative mt-1">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-[#60736C]" />
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] pl-10 pr-4 py-2.5 text-xs text-[#263832] focus:border-[#2FC3A5] focus:bg-white focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Phone Number</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-[#60736C]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98110 00000"
                    className="w-full rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] pl-10 pr-4 py-2.5 text-xs text-[#263832] placeholder-[#60736C] focus:border-[#2FC3A5] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2FC3A5] py-2.5 text-xs font-bold text-[#263832] hover:bg-[#26B396] shadow-sm transition"
            >
              <span>{isLoading ? 'Submitting Application...' : 'Submit for HR Approval'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#60736C]">
            Already have an approved account?{' '}
            <Link href="/login" className="font-bold text-[#2FC3A5] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
