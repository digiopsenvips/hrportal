'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { MemberDetailModal } from '@/components/members/MemberDetailModal';
import { Member } from '@/types';
import {
  Trophy,
  Award,
  Sliders,
  CheckCircle,
  Clock,
  FileText,
  ClipboardCheck,
  Calendar,
  Sparkles,
  TrendingUp,
  Info,
} from 'lucide-react';

export default function LeaderboardPage() {
  const { currentUser, permissions } = useAuth();
  const { hrLeaderboard, settings, updateSettings } = useData();

  const [timeframe, setTimeframe] = useState<'all' | 'monthly' | 'weekly'>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showWeightSliders, setShowWeightSliders] = useState(false);

  // Editable weights state
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

  const [isSavingWeights, setIsSavingWeights] = useState(false);

  const handleSaveWeights = async () => {
    setIsSavingWeights(true);
    await updateSettings({ leaderboardWeights: weights });
    setIsSavingWeights(false);
    setShowWeightSliders(false);
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            <span>HR Operations Weighted Leaderboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Transparent, multi-dimensional evaluation based on verified tasks, on-time submissions, MOM quality, and attendance audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(permissions.canManageHRTeam || permissions.canConfigureSocietySettings) && (
            <button
              onClick={() => setShowWeightSliders(!showWeightSliders)}
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
            >
              <Sliders className="h-4 w-4" />
              <span>Configure Formula Weights</span>
            </button>
          )}

          {/* Timeframe selector */}
          <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800 p-1">
            {['all', 'monthly', 'weekly'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as any)}
                className={`rounded-lg px-3 py-1 text-xs font-bold uppercase transition ${
                  timeframe === tf
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Formula Transparency Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-bold text-amber-400 uppercase text-[10px] tracking-wider mb-2">
          <Info className="h-4 w-4" />
          <span>Configured Mathematical Weight Distribution:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-200">
            Verified Tasks: <strong className="text-amber-400">{settings.leaderboardWeights.verifiedCompletion}%</strong>
          </span>
          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-200">
            On-Time Submissions: <strong className="text-emerald-400">{settings.leaderboardWeights.onTimeCompletion}%</strong>
          </span>
          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-200">
            MOM Quality: <strong className="text-blue-400">{settings.leaderboardWeights.momQuality}%</strong>
          </span>
          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-200">
            Attendance Accuracy: <strong className="text-purple-400">{settings.leaderboardWeights.attendanceAccuracy}%</strong>
          </span>
          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-200">
            Coordination & Events: <strong className="text-rose-400">{settings.leaderboardWeights.meetingEventCoordination}%</strong>
          </span>
          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-200">
            Reviewer Quality: <strong className="text-amber-300">{settings.leaderboardWeights.reviewerScore}%</strong>
          </span>
        </div>
      </div>

      {/* Weight Editor Slider Drawer (if opened by HR leadership) */}
      {showWeightSliders && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6 animate-in fade-in">
          <h3 className="text-sm font-bold text-white mb-2">
            Configure HR Leaderboard Scoring Formula
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Adjust the percentage weights for each operational dimension. Weights are automatically normalized to 100%.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-300 flex justify-between">
                <span>Verified Task Completion:</span>
                <span className="font-bold text-amber-400">{weights.verifiedCompletion}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.verifiedCompletion}
                onChange={(e) => setWeights({ ...weights, verifiedCompletion: Number(e.target.value) })}
                className="w-full mt-1 accent-amber-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 flex justify-between">
                <span>On-Time Completion Rate:</span>
                <span className="font-bold text-emerald-400">{weights.onTimeCompletion}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.onTimeCompletion}
                onChange={(e) => setWeights({ ...weights, onTimeCompletion: Number(e.target.value) })}
                className="w-full mt-1 accent-emerald-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 flex justify-between">
                <span>MOM Preparation & Quality:</span>
                <span className="font-bold text-blue-400">{weights.momQuality}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.momQuality}
                onChange={(e) => setWeights({ ...weights, momQuality: Number(e.target.value) })}
                className="w-full mt-1 accent-blue-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 flex justify-between">
                <span>Attendance Management:</span>
                <span className="font-bold text-purple-400">{weights.attendanceAccuracy}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.attendanceAccuracy}
                onChange={(e) => setWeights({ ...weights, attendanceAccuracy: Number(e.target.value) })}
                className="w-full mt-1 accent-purple-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 flex justify-between">
                <span>Meeting & Event Coordination:</span>
                <span className="font-bold text-rose-400">{weights.meetingEventCoordination}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.meetingEventCoordination}
                onChange={(e) => setWeights({ ...weights, meetingEventCoordination: Number(e.target.value) })}
                className="w-full mt-1 accent-rose-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 flex justify-between">
                <span>Reviewer Quality Score:</span>
                <span className="font-bold text-amber-300">{weights.reviewerScore}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={weights.reviewerScore}
                onChange={(e) => setWeights({ ...weights, reviewerScore: Number(e.target.value) })}
                className="w-full mt-1 accent-amber-300"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowWeightSliders(false)}
              className="rounded-xl px-4 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWeights}
              disabled={isSavingWeights}
              className="rounded-xl bg-amber-400 px-5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300"
            >
              {isSavingWeights ? 'Saving...' : 'Save & Recalculate Standings'}
            </button>
          </div>
        </div>
      )}

      {/* Podium for Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {hrLeaderboard.slice(0, 3).map((entry, idx) => (
          <div
            key={entry.member.id}
            onClick={() => setSelectedMember(entry.member)}
            className={`rounded-3xl border p-6 shadow-xl relative overflow-hidden cursor-pointer transition hover:-translate-y-1 ${
              idx === 0
                ? 'border-amber-400/80 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 ring-2 ring-amber-400/30'
                : idx === 1
                ? 'border-slate-500/60 bg-gradient-to-b from-slate-500/10 via-slate-900 to-slate-900'
                : 'border-amber-700/60 bg-gradient-to-b from-amber-800/10 via-slate-900 to-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl font-black text-sm ${
                  idx === 0
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                    : idx === 1
                    ? 'bg-slate-300 text-slate-950'
                    : 'bg-amber-800 text-amber-200'
                }`}
              >
                #{entry.rank}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {entry.compositeScore} Score
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <img
                src={entry.member.avatar}
                alt={entry.member.name}
                className="h-14 w-14 rounded-2xl border-2 border-slate-700 object-cover"
              />
              <div>
                <h3 className="font-extrabold text-white text-base">{entry.member.name}</h3>
                <div className="text-xs text-amber-400 font-semibold">{entry.assignedDepartmentName}</div>
                <div className="text-[11px] text-slate-400">{entry.member.roleTitle}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
              <div>Verified: <strong className="text-emerald-400">{entry.verifiedTasksCount}</strong></div>
              <div>On-Time: <strong className="text-blue-400">{entry.onTimeCompletionRate}%</strong></div>
              <div>MOMs: <strong className="text-amber-400">{entry.momsPreparedCount}</strong></div>
              <div>Reviewer: <strong className="text-white">{entry.averageReviewerScore}/10</strong></div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-800/60 uppercase text-[10px] font-bold tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">HR Specialist</th>
                <th className="px-4 py-3">Assigned Department</th>
                <th className="px-4 py-3 text-amber-400">Score</th>
                <th className="px-4 py-3">Verified Tasks</th>
                <th className="px-4 py-3">On-Time %</th>
                <th className="px-4 py-3">MOMs Published</th>
                <th className="px-4 py-3">Attendance Audits</th>
                <th className="px-4 py-3">Reviewer Score</th>
                <th className="px-4 py-3 text-right">Logged Effort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {hrLeaderboard.map((entry) => (
                <tr
                  key={entry.member.id}
                  onClick={() => setSelectedMember(entry.member)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="px-4 py-3 font-bold font-mono text-amber-400">
                    #{entry.rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={entry.member.avatar}
                        alt={entry.member.name}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                      <span className="font-bold text-white hover:text-amber-400">
                        {entry.member.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{entry.assignedDepartmentName}</td>
                  <td className="px-4 py-3 font-black text-amber-400 font-mono text-sm">
                    {entry.compositeScore}
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">
                    {entry.verifiedTasksCount} / {entry.totalAssignedTasks}
                  </td>
                  <td className="px-4 py-3 text-blue-400 font-mono">
                    {entry.onTimeCompletionRate}%
                  </td>
                  <td className="px-4 py-3 text-amber-300 font-mono">
                    {entry.momsPreparedCount}
                  </td>
                  <td className="px-4 py-3 text-purple-400 font-mono">
                    {entry.attendanceSheetsCompleted}
                  </td>
                  <td className="px-4 py-3 text-white font-semibold">
                    {entry.averageReviewerScore} / 10
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">
                    {entry.loggedHours} hrs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
