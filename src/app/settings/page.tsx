'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import {
  Sliders,
  Shield,
  Building2,
  Lock,
  Trophy,
  ClipboardCheck,
  RotateCcw,
  Save,
  CheckCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const { currentUser, permissions } = useAuth();
  const { settings, updateSettings, departments, refreshAll } = useData();

  const [societyName, setSocietyName] = useState(settings?.societyName || 'Enactus VIPS-TC');
  const [societyShortName, setSocietyShortName] = useState(settings?.societyShortName || 'ENVIPS');

  // Attendance Formula Settings
  const [excludeExcused, setExcludeExcused] = useState(
    Boolean(settings?.attendanceFormula.excludeExcusedFromDenominator)
  );
  const [excludeLeave, setExcludeLeave] = useState(
    Boolean(settings?.attendanceFormula.excludeLeaveFromDenominator)
  );

  // Directory Privacy Settings
  const [hideEnrollment, setHideEnrollment] = useState(
    Boolean(settings?.directoryPrivacy.hideEnrollmentForMembers)
  );
  const [hideJeeRank, setHideJeeRank] = useState(
    Boolean(settings?.directoryPrivacy.hideJeeRankForMembers)
  );
  const [hideEmail, setHideEmail] = useState(
    Boolean(settings?.directoryPrivacy.hideEmailForMembers)
  );

  // HR Leaderboard weights
  const [weights, setWeights] = useState(
    settings?.leaderboardWeights || {
      verifiedCompletion: 25,
      onTimeCompletion: 20,
      momQuality: 20,
      attendanceAccuracy: 15,
      meetingEventCoordination: 10,
      reviewerScore: 10,
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    await updateSettings({
      societyName,
      societyShortName,
      attendanceFormula: {
        excludeExcusedFromDenominator: excludeExcused,
        excludeLeaveFromDenominator: excludeLeave,
      },
      directoryPrivacy: {
        hideEnrollmentForMembers: hideEnrollment,
        hideJeeRankForMembers: hideJeeRank,
        hideEmailForMembers: hideEmail,
        hidePhoneForMembers: true,
      },
      leaderboardWeights: weights,
    });

    await refreshAll();
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDatabase = async () => {
    if (confirm('Are you sure you want to restore the initial seed records? This will reinitialize all sample departments, meetings, and MoMs.')) {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_DATABASE' }),
      });
      await refreshAll();
      window.location.reload();
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
          <Sliders className="h-3.5 w-3.5 text-[#2FC3A5]" />
          <span>System Administration</span>
        </div>
        <h1 className="text-2xl font-black text-[#263832]">Governance & Settings</h1>
        <p className="text-xs text-[#637d74] mt-1">
          Administrator settings for society metadata, attendance formula, directory privacy masks, and scoring parameters
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#2FC3A5] bg-[#DDF7EF] p-4 text-xs font-semibold text-[#0D5143] animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-[#2FC3A5]" />
          <span>Society governance settings successfully updated and synchronized!</span>
        </div>
      )}

      <form onSubmit={handleSaveAllSettings} className="space-y-6">
        {/* Section 1: Society Identity */}
        <div className="rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#263832] uppercase tracking-wider flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#2FC3A5]" />
            <span>Society Identity</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#263832]">Society Full Name</label>
              <input
                type="text"
                value={societyName}
                onChange={(e) => setSocietyName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#263832]">Society Acronym / Short Name</label>
              <input
                type="text"
                value={societyShortName}
                onChange={(e) => setSocietyShortName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Attendance Formula Settings */}
        <div className="rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#263832] uppercase tracking-wider flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-[#2FC3A5]" />
            <span>Attendance Eligibility & Denominator Calculation</span>
          </h2>
          <p className="text-xs text-[#637d74]">
            Formula: <code>Attendance % = (Attended / Eligible Meetings) × 100</code>
          </p>

          <div className="space-y-3 text-xs text-[#263832]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeExcused}
                onChange={(e) => setExcludeExcused(e.target.checked)}
                className="h-4 w-4 rounded text-[#2FC3A5] focus:ring-[#2FC3A5]"
              />
              <span>
                <strong>Exclude Excused Absences from Denominator:</strong> When enabled, official excused absences do not penalize a member's attendance percentage.
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeLeave}
                onChange={(e) => setExcludeLeave(e.target.checked)}
                className="h-4 w-4 rounded text-[#2FC3A5] focus:ring-[#2FC3A5]"
              />
              <span>
                <strong>Exclude Approved Leave from Denominator:</strong> When enabled, members on academic or medical leave have those meetings subtracted from the divisor.
              </span>
            </label>
          </div>
        </div>

        {/* Section 3: Member Directory Privacy Rules */}
        <div className="rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#263832] uppercase tracking-wider flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#2FC3A5]" />
            <span>Member Directory Privacy & Access Controls</span>
          </h2>
          <p className="text-xs text-[#637d74]">
            Configure which sensitive fields are masked when ordinary members browse the Active Member Directory. Authorized leadership retain full visibility.
          </p>

          <div className="space-y-3 text-xs text-[#263832]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hideEnrollment}
                onChange={(e) => setHideEnrollment(e.target.checked)}
                className="h-4 w-4 rounded text-[#2FC3A5] focus:ring-[#2FC3A5]"
              />
              <span>
                <strong>Mask College Enrollment Numbers:</strong> Hide student enrollment IDs from ordinary members by default.
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hideJeeRank}
                onChange={(e) => setHideJeeRank(e.target.checked)}
                className="h-4 w-4 rounded text-[#2FC3A5] focus:ring-[#2FC3A5]"
              />
              <span>
                <strong>Mask JEE Rank / Entrance Test Scores:</strong> Restrict competitive exam ranks strictly to authorized HR roles.
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hideEmail}
                onChange={(e) => setHideEmail(e.target.checked)}
                className="h-4 w-4 rounded text-[#2FC3A5] focus:ring-[#2FC3A5]"
              />
              <span>
                <strong>Mask Contact Email Addresses:</strong> Shield personal email addresses from public directory view.
              </span>
            </label>
          </div>
        </div>

        {/* Section 4: HR Leaderboard Weights */}
        <div className="rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#263832] uppercase tracking-wider flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#2FC3A5]" />
            <span>HR Operations Leaderboard Scoring Weights</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[#263832] flex justify-between font-semibold">
                <span>Verified Task Completion:</span>
                <span className="font-bold text-[#2FC3A5]">{weights.verifiedCompletion}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.verifiedCompletion}
                onChange={(e) => setWeights({ ...weights, verifiedCompletion: Number(e.target.value) })}
                className="w-full mt-1 accent-[#2FC3A5]"
              />
            </div>
            <div>
              <label className="text-xs text-[#263832] flex justify-between font-semibold">
                <span>On-Time Completion Rate:</span>
                <span className="font-bold text-[#2FC3A5]">{weights.onTimeCompletion}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.onTimeCompletion}
                onChange={(e) => setWeights({ ...weights, onTimeCompletion: Number(e.target.value) })}
                className="w-full mt-1 accent-[#2FC3A5]"
              />
            </div>
            <div>
              <label className="text-xs text-[#263832] flex justify-between font-semibold">
                <span>MoM Preparation & Quality:</span>
                <span className="font-bold text-[#2FC3A5]">{weights.momQuality}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.momQuality}
                onChange={(e) => setWeights({ ...weights, momQuality: Number(e.target.value) })}
                className="w-full mt-1 accent-[#2FC3A5]"
              />
            </div>
            <div>
              <label className="text-xs text-[#263832] flex justify-between font-semibold">
                <span>Attendance Management:</span>
                <span className="font-bold text-[#2FC3A5]">{weights.attendanceAccuracy}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.attendanceAccuracy}
                onChange={(e) => setWeights({ ...weights, attendanceAccuracy: Number(e.target.value) })}
                className="w-full mt-1 accent-[#2FC3A5]"
              />
            </div>
            <div>
              <label className="text-xs text-[#263832] flex justify-between font-semibold">
                <span>Meeting Coordination:</span>
                <span className="font-bold text-[#2FC3A5]">{weights.meetingEventCoordination}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.meetingEventCoordination}
                onChange={(e) => setWeights({ ...weights, meetingEventCoordination: Number(e.target.value) })}
                className="w-full mt-1 accent-[#2FC3A5]"
              />
            </div>
            <div>
              <label className="text-xs text-[#263832] flex justify-between font-semibold">
                <span>Reviewer Quality Score:</span>
                <span className="font-bold text-[#2FC3A5]">{weights.reviewerScore}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.reviewerScore}
                onChange={(e) => setWeights({ ...weights, reviewerScore: Number(e.target.value) })}
                className="w-full mt-1 accent-[#2FC3A5]"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDatabase}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restore Initial Seed Database</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Applying Settings...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
