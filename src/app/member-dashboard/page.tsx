'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { calculateMemberAttendance } from '@/lib/calculations';
import {
  User,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  AlertTriangle,
  Send,
  Plus,
  TrendingUp,
  CheckSquare,
  Shield,
  Layers,
  Edit,
  ExternalLink,
} from 'lucide-react';

export default function MemberDashboardPage() {
  const { currentUser, updateCurrentUserProfile } = useAuth();
  const {
    tasks,
    meetings,
    attendance,
    moms,
    announcements,
    settings,
    updateTask,
    submitAttendanceCorrection,
  } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'calendar' | 'hours'>('overview');
  const [selectedTaskToUpdate, setSelectedTaskToUpdate] = useState<any | null>(null);
  const [loggedHoursInput, setLoggedHoursInput] = useState<number>(0);
  const [completionNotesInput, setCompletionNotesInput] = useState('');
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionMeetingId, setCorrectionMeetingId] = useState('');
  const [correctionAttendanceId, setCorrectionAttendanceId] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit personal profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone || '');
  const [bioInput, setBioInput] = useState(currentUser?.bio || '');

  if (!currentUser || !settings) {
    return (
      <div className="py-20 text-center text-slate-400">
        Loading member portal profile...
      </div>
    );
  }

  // Member's specific attendance stats
  const memberAttendance = calculateMemberAttendance(
    currentUser.id,
    attendance,
    meetings,
    settings
  );

  // Member's assigned tasks
  const myTasks = tasks.filter((t) => t.assignedMemberId === currentUser.id);
  const myCompletedTasks = myTasks.filter((t) => t.status === 'Completed');
  const myPendingTasks = myTasks.filter((t) => t.status !== 'Completed');
  const myOverdueTasks = myPendingTasks.filter(
    (t) => new Date(t.deadline) < new Date(new Date().setHours(0, 0, 0, 0))
  );

  // Member's meetings
  const myMeetings = meetings.filter(
    (m) =>
      m.departmentId === 'ALL' ||
      m.departmentId === currentUser.primaryDepartmentId ||
      m.departmentId === currentUser.assignedDepartmentId ||
      m.attendeeMemberIds.includes(currentUser.id)
  );

  const upcomingMyMeetings = myMeetings.filter(
    (m) => m.status === 'Scheduled' && new Date(m.date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  // Published MOMs
  const recentPublishedMoms = moms
    .filter((m) => m.publicationStatus === 'Published')
    .slice(0, 5);

  // Logged effort hours
  const totalEstimatedHours = myTasks.reduce((acc, t) => acc + (t.estimatedEffortHours || 0), 0);
  const totalLoggedHours = myTasks.reduce((acc, t) => acc + (t.actualEffortHours || 0), 0);
  const completedWorkHours = myCompletedTasks.reduce((acc, t) => acc + (t.actualEffortHours || 0), 0);
  const taskCompletionRate = myTasks.length > 0 ? Math.round((myCompletedTasks.length / myTasks.length) * 100) : 100;

  // Member's attendance records
  const myAttendanceRecords = attendance.filter((a) => a.memberId === currentUser.id);

  // Handle task status progression
  const handleUpdateTaskStatus = async (task: any, newStatus: string) => {
    await updateTask({
      id: task.id,
      status: newStatus,
      actualEffortHours: loggedHoursInput || task.actualEffortHours,
      completionEvidence: completionNotesInput || task.completionEvidence,
    });
    setSelectedTaskToUpdate(null);
    setLoggedHoursInput(0);
    setCompletionNotesInput('');
  };

  // Submit attendance correction
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionAttendanceId || !correctionReason) return;
    setIsSubmitting(true);
    await submitAttendanceCorrection({
      attendanceId: correctionAttendanceId,
      meetingId: correctionMeetingId,
      memberId: currentUser.id,
      requestedStatus: 'Excused',
      reason: correctionReason,
    });
    setIsSubmitting(false);
    setShowCorrectionModal(false);
    setCorrectionReason('');
  };

  const handleSaveProfile = async () => {
    await updateCurrentUserProfile({
      phone: phoneInput,
      bio: bioInput,
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-6">
      {/* Member Header Card */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-20 w-20 rounded-2xl border-2 border-amber-400/80 object-cover shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{currentUser.name}</h1>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  {currentUser.status}
                </span>
              </div>
              <div className="text-sm font-semibold text-amber-400">{currentUser.roleTitle}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {currentUser.memberId} • {currentUser.branch} (Sem {currentUser.currentSemester})
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:border-amber-400 hover:text-amber-300 transition"
            >
              <Edit className="h-4 w-4" />
              <span>{isEditingProfile ? 'Cancel Edit' : 'Edit My Profile'}</span>
            </button>
            <button
              onClick={() => setShowCorrectionModal(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-500/20 transition"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Request Attendance Correction</span>
            </button>
          </div>
        </div>

        {/* Profile bio / phone edit form */}
        {isEditingProfile && (
          <div className="mt-6 border-t border-slate-800 pt-4 animate-in fade-in">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              Update Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400">Phone Number</label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Bio / About Me</label>
                <input
                  type="text"
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSaveProfile}
                className="rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300"
              >
                Save Profile Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800">
        {[
          { key: 'overview', label: 'My Overview' },
          { key: 'activity', label: 'My Activity Timeline' },
          { key: 'calendar', label: 'My Schedule & Deadlines' },
          { key: 'hours', label: 'My Logged Hours & Progress' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
              activeTab === tab.key
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs text-slate-400">My Attendance Rate</div>
              <div className="text-2xl font-black text-amber-400">{memberAttendance.percentage}%</div>
              <div className="text-[11px] text-slate-400">
                {memberAttendance.attended} / {memberAttendance.totalEligible} meetings
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs text-slate-400">Tasks Completed</div>
              <div className="text-2xl font-black text-emerald-400">{myCompletedTasks.length}</div>
              <div className="text-[11px] text-slate-400">
                {myPendingTasks.length} currently assigned
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs text-slate-400">Upcoming Meetings</div>
              <div className="text-2xl font-black text-blue-400">{upcomingMyMeetings.length}</div>
              <div className="text-[11px] text-slate-400">Department & Society</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs text-slate-400">Logged Work Hours</div>
              <div className="text-2xl font-black text-indigo-400">{totalLoggedHours}h</div>
              <div className="text-[11px] text-slate-400">
                {totalEstimatedHours}h estimated effort
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Active Tasks List */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-amber-400" />
                  <span>My Assigned Tasks ({myTasks.length})</span>
                </h3>
                <span className="text-xs text-amber-400">{myPendingTasks.length} pending</span>
              </div>

              {myTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  You have no tasks assigned right now. Great job!
                </div>
              ) : (
                <div className="space-y-3">
                  {myTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-white">{task.title}</div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{task.description}</p>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                            task.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : task.status === 'In Progress'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                        <span>Deadline: <span className="text-slate-200">{task.deadline}</span></span>
                        <span>Logged: <span className="text-amber-400 font-bold">{task.actualEffortHours} hrs</span></span>
                        {task.status !== 'Completed' && (
                          <button
                            onClick={() => {
                              setSelectedTaskToUpdate(task);
                              setLoggedHoursInput(task.actualEffortHours || 2);
                            }}
                            className="rounded bg-slate-700 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-400 hover:text-slate-950 transition"
                          >
                            Update Progress
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Meetings & Published MOMs */}
            <div className="space-y-6">
              {/* Upcoming Meetings */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <span>My Upcoming Meetings</span>
                </h3>

                {upcomingMyMeetings.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No scheduled meetings coming up.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {upcomingMyMeetings.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">{m.title}</div>
                          <div className="text-[10px] text-slate-400">
                            {m.date} at {m.startTime} • {m.mode} ({m.location})
                          </div>
                        </div>
                        {m.meetingLink && (
                          <a
                            href={m.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-blue-500/20 px-2.5 py-1 text-[10px] font-bold text-blue-400 hover:bg-blue-500/30"
                          >
                            Join Link
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Society MOMs */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-amber-400" />
                  <span>Published Meeting Minutes (MOM)</span>
                </h3>
                <div className="space-y-2">
                  {recentPublishedMoms.map((mom) => (
                    <div
                      key={mom.id}
                      className="rounded-xl border border-slate-800 bg-slate-800/30 p-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-white">{mom.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {mom.meetingDate} • Dept: {mom.departmentId}
                        </div>
                      </div>
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
                        Published
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVITY TIMELINE */}
      {activeTab === 'activity' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
            Chronological Activity & Participation History
          </h3>
          <div className="relative border-l border-slate-800 pl-6 space-y-6">
            {myAttendanceRecords.map((att) => {
              const meet = meetings.find((m) => m.id === att.meetingId);
              return (
                <div key={att.id} className="relative">
                  <div className="absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-4 ring-slate-900">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div className="text-xs font-bold text-white">
                    Attendance Recorded: {att.status}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Meeting: {meet ? meet.title : 'Departmental Sync'} on {meet?.date}
                  </div>
                  {att.notes && (
                    <div className="mt-1 text-[10px] text-slate-400 italic">
                      Note: {att.notes}
                    </div>
                  )}
                </div>
              );
            })}

            {myTasks.map((t) => (
              <div key={t.id} className="relative">
                <div className="absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 ring-4 ring-slate-900">
                  <Clock className="h-3 w-3" />
                </div>
                <div className="text-xs font-bold text-white">
                  Task Assignment: {t.title}
                </div>
                <div className="text-[11px] text-slate-400">
                  Category: {t.category} • Status: {t.status} • {t.actualEffortHours} hrs logged
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            My Schedule, Meetings & Task Deadlines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myMeetings.map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    {m.date} • {m.startTime}
                  </span>
                  <span className="text-[10px] text-slate-400">{m.mode}</span>
                </div>
                <h4 className="mt-2 text-sm font-bold text-white">{m.title}</h4>
                <p className="mt-1 text-xs text-slate-400">{m.agenda}</p>
                <div className="mt-3 text-xs text-slate-300">
                  Venue: <span className="font-medium text-amber-400">{m.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HOURS & PROGRESS */}
      {activeTab === 'hours' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs text-slate-400">Actual Logged Work Hours</div>
              <div className="text-2xl font-black text-amber-400">{totalLoggedHours}h</div>
              <div className="text-[10px] text-slate-400 mt-1">
                Verified work across all assigned responsibilities
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs text-slate-400">Completed Work Effort</div>
              <div className="text-2xl font-black text-emerald-400">{completedWorkHours}h</div>
              <div className="text-[10px] text-slate-400 mt-1">
                {taskCompletionRate}% task completion efficiency
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs text-slate-400">Estimated Effort Target</div>
              <div className="text-2xl font-black text-blue-400">{totalEstimatedHours}h</div>
              <div className="text-[10px] text-slate-400 mt-1">
                Scheduled meeting time is excluded from work hours
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Update Modal */}
      {selectedTaskToUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2">Update Task Progress</h3>
            <p className="text-xs text-slate-400 mb-4">{selectedTaskToUpdate.title}</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">Logged Hours Spent</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={loggedHoursInput}
                  onChange={(e) => setLoggedHoursInput(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Completion Evidence / Work Notes</label>
                <textarea
                  rows={3}
                  value={completionNotesInput}
                  onChange={(e) => setCompletionNotesInput(e.target.value)}
                  placeholder="Provide proof link, summary of changes, or deliverables completed..."
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTaskToUpdate(null)}
                className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateTaskStatus(selectedTaskToUpdate, 'In Progress')}
                className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/20"
              >
                Save as In Progress
              </button>
              <button
                onClick={() => handleUpdateTaskStatus(selectedTaskToUpdate, 'Completed')}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                Submit as Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2">
              Request Attendance Correction
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              If an official attendance record was marked incorrectly or you had prior university authorization, submit a correction ticket for review by HR.
            </p>

            <form onSubmit={handleCorrectionSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">Select Meeting Record</label>
                <select
                  required
                  value={correctionAttendanceId}
                  onChange={(e) => {
                    setCorrectionAttendanceId(e.target.value);
                    const att = myAttendanceRecords.find((a) => a.id === e.target.value);
                    if (att) setCorrectionMeetingId(att.meetingId);
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Choose past meeting attendance --</option>
                  {myAttendanceRecords.map((att) => {
                    const m = meetings.find((meet) => meet.id === att.meetingId);
                    return (
                      <option key={att.id} value={att.id}>
                        {m ? m.title : att.meetingId} ({att.status})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300">Reason for Request</label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Explain why you were late or absent (e.g. University exam viva, pre-informed department head)..."
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Correction Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
