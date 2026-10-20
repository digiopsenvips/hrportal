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
  const { hrLeaderboard, settings, updateSettings, refreshAll } = useData();

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
    await refreshAll();
    setIsSavingWeights(false);
    setShowWeightSliders(false);
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <Trophy className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Operational Excellence</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">HR Weighted Leaderboard</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Transparent, multi-dimensional evaluation based on verified tasks, on-time submissions, MoM quality, and attendance audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(permissions.canManageHRTeam || permissions.canConfigureSocietySettings) && (
            <button
              onClick={() => setShowWeightSliders(!showWeightSliders)}
              className="flex items-center gap-2 rounded-xl border border-[#E3EBE7] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#263832] hover:bg-[#DDF7EF] hover:border-[#2FC3A5] transition shadow-sm"
            >
              <Sliders className="h-4 w-4 text-[#2FC3A5]" />
              <span>Configure Formula Weights</span>
            </button>
          )}

          {/* Timeframe selector */}
          <div className="flex items-center rounded-xl border border-[#E3EBE7] bg-white p-1 shadow-sm">
            {['all', 'monthly', 'weekly'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as any)}
                className={`rounded-lg px-3 py-1 text-xs font-bold uppercase transition ${
                  timeframe === tf
                    ? 'bg-[#2FC3A5] text-white shadow-xs'
                    : 'text-[#637d74] hover:text-[#263832]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Formula Transparency Card */}
      <div className="rounded-2xl border border-[#E3EBE7] bg-white p-4 text-xs text-[#263832] shadow-sm">
        <div className="flex items-center gap-2 font-bold text-[#0D5143] uppercase text-[10px] tracking-wider mb-2">
          <Info className="h-4 w-4 text-[#2FC3A5]" />
          <span>Configured Mathematical Weight Distribution:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-lg bg-[#F7F9F7] border border-[#E3EBE7] px-2.5 py-1 text-[#263832]">
            Verified Tasks: <strong className="text-[#2FC3A5]">{settings.leaderboardWeights.verifiedCompletion}%</strong>
          </span>
          <span className="rounded-lg bg-[#F7F9F7] border border-[#E3EBE7] px-2.5 py-1 text-[#263832]">
            On-Time Submissions: <strong className="text-[#0D5143]">{settings.leaderboardWeights.onTimeCompletion}%</strong>
          </span>
          <span className="rounded-lg bg-[#F7F9F7] border border-[#E3EBE7] px-2.5 py-1 text-[#263832]">
            MoM Quality: <strong className="text-[#2FC3A5]">{settings.leaderboardWeights.momQuality}%</strong>
          </span>
          <span className="rounded-lg bg-[#F7F9F7] border border-[#E3EBE7] px-2.5 py-1 text-[#263832]">
            Attendance Accuracy: <strong className="text-[#0D5143]">{settings.leaderboardWeights.attendanceAccuracy}%</strong>
          </span>
          <span className="rounded-lg bg-[#F7F9F7] border border-[#E3EBE7] px-2.5 py-1 text-[#263832]">
            Coordination & Events: <strong className="text-[#2FC3A5]">{settings.leaderboardWeights.meetingEventCoordination}%</strong>
          </span>
          <span className="rounded-lg bg-[#F7F9F7] border border-[#E3EBE7] px-2.5 py-1 text-[#263832]">
            Reviewer Quality: <strong className="text-[#0D5143]">{settings.leaderboardWeights.reviewerScore}%</strong>
          </span>
        </div>
      </div>

      {/* Weight Editor Slider Drawer (if opened by HR leadership) */}
      {showWeightSliders && (
        <div className="rounded-3xl border border-[#2FC3A5] bg-[#DDF7EF]/40 p-6 shadow-sm animate-fadeIn">
          <h3 className="text-sm font-bold text-[#263832] mb-1">
            Configure HR Leaderboard Scoring Formula
          </h3>
          <p className="text-xs text-[#637d74] mb-4">
            Adjust the percentage weights for each operational dimension. Weights are automatically normalized to 100%.
          </p>

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
                <span>Meeting & Event Coordination:</span>
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

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowWeightSliders(false)}
              className="rounded-xl px-4 py-1.5 text-xs font-semibold text-[#637d74] hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWeights}
              disabled={isSavingWeights}
              className="rounded-xl bg-[#2FC3A5] px-5 py-1.5 text-xs font-bold text-white hover:bg-[#28af94] transition shadow-xs"
            >
              {isSavingWeights ? 'Saving...' : 'Save & Recalculate Standings'}
            </button>
          </div>
        </div>
      )}

      {/* Podium for Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {hrLeaderboard.slice(0, 3).map((entry, idx) => (
          <div
            key={entry.member.id}
            onClick={() => setSelectedMember(entry.member)}
            className={`rounded-3xl border p-6 shadow-sm relative overflow-hidden cursor-pointer transition hover:-translate-y-1 ${
              idx === 0
                ? 'border-[#2FC3A5] bg-[#DDF7EF]/40 ring-2 ring-[#2FC3A5]/30'
                : 'border-[#E3EBE7] bg-white hover:border-[#2FC3A5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl font-black text-sm ${
                  idx === 0
                    ? 'bg-[#2FC3A5] text-white shadow-sm'
                    : idx === 1
                    ? 'bg-[#E3EBE7] text-[#263832]'
                    : 'bg-[#E7F3D7] text-[#0D5143]'
                }`}
              >
                #{entry.rank}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D5143] bg-[#E7F3D7] px-2.5 py-0.5 rounded-full">
                {entry.compositeScore} Score
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <img
                src={entry.member.avatar}
                alt={entry.member.name}
                className="h-14 w-14 rounded-2xl border-2 border-white object-cover shadow-xs"
              />
              <div>
                <h3 className="font-extrabold text-[#263832] text-base">{entry.member.name}</h3>
                <div className="text-xs text-[#2FC3A5] font-semibold">{entry.assignedDepartmentName}</div>
                <div className="text-[11px] text-[#637d74]">{entry.member.roleTitle}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#E3EBE7] pt-3 text-xs text-[#263832]">
              <div>Verified: <strong className="text-[#0D5143]">{entry.verifiedTasksCount}</strong></div>
              <div>On-Time: <strong className="text-[#2FC3A5]">{entry.onTimeCompletionRate}%</strong></div>
              <div>MoMs: <strong className="text-[#0D5143]">{entry.momsPreparedCount}</strong></div>
              <div>Reviewer: <strong className="text-[#263832]">{entry.averageReviewerScore}/10</strong></div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div className="rounded-2xl border border-[#E3EBE7] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#263832]">
            <thead className="border-b border-[#E3EBE7] bg-[#F7F9F7] uppercase text-[10px] font-bold tracking-wider text-[#637d74]">
              <tr>
                <th className="px-4 py-3.5">Rank</th>
                <th className="px-4 py-3.5">HR Specialist</th>
                <th className="px-4 py-3.5">Assigned Department</th>
                <th className="px-4 py-3.5 text-[#0D5143]">Score</th>
                <th className="px-4 py-3.5">Verified Tasks</th>
                <th className="px-4 py-3.5">On-Time %</th>
                <th className="px-4 py-3.5">MoMs Published</th>
                <th className="px-4 py-3.5">Attendance Audits</th>
                <th className="px-4 py-3.5">Reviewer Score</th>
                <th className="px-4 py-3.5 text-right">Logged Effort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EBE7]">
              {hrLeaderboard.map((entry) => (
                <tr
                  key={entry.member.id}
                  onClick={() => setSelectedMember(entry.member)}
                  className="hover:bg-[#F7F9F7] cursor-pointer transition"
                >
                  <td className="px-4 py-3.5 font-bold font-mono text-[#2FC3A5]">
                    #{entry.rank}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={entry.member.avatar}
                        alt={entry.member.name}
                        className="h-7 w-7 rounded-full object-cover border border-[#E3EBE7]"
                      />
                      <span className="font-bold text-[#263832] hover:text-[#2FC3A5] transition">
                        {entry.member.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[#637d74]">{entry.assignedDepartmentName}</td>
                  <td className="px-4 py-3.5 font-black text-[#0D5143] font-mono text-sm">
                    {entry.compositeScore}
                  </td>
                  <td className="px-4 py-3.5 text-[#0D5143] font-semibold">
                    {entry.verifiedTasksCount} / {entry.totalAssignedTasks}
                  </td>
                  <td className="px-4 py-3.5 text-[#2FC3A5] font-mono">
                    {entry.onTimeCompletionRate}%
                  </td>
                  <td className="px-4 py-3.5 text-[#263832] font-mono">
                    {entry.momsPreparedCount}
                  </td>
                  <td className="px-4 py-3.5 text-[#263832] font-mono">
                    {entry.attendanceSheetsCompleted}
                  </td>
                  <td className="px-4 py-3.5 text-[#263832] font-semibold">
                    {entry.averageReviewerScore} / 10
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-[#637d74]">
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
