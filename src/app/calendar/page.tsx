'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Meeting, MeetingMode } from '@/types';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Video,
  AlertTriangle,
  Download,
  Filter,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Users,
  Copy,
  Check,
  CalendarCheck,
  ShieldAlert,
} from 'lucide-react';

export default function CalendarPage() {
  const { currentUser, permissions } = useAuth();
  const { departments, members, meetings, moms, attendance, events, addMeeting, updateMeeting, refreshAll } = useData();

  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDeptId, setFormDeptId] = useState('ALL');
  const [formDate, setFormDate] = useState('2026-10-25');
  const [formStartTime, setFormStartTime] = useState('16:00');
  const [formEndTime, setFormEndTime] = useState('17:30');
  const [formMode, setFormMode] = useState<MeetingMode>('Online');
  const [formLocation, setFormLocation] = useState('Google Meet');
  const [formLink, setFormLink] = useState('https://meet.google.com/enactus-sync');
  const [formAgenda, setFormAgenda] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (filterDept !== 'ALL' && m.departmentId !== filterDept && m.departmentId !== 'ALL') {
        return false;
      }
      if (filterStatus !== 'ALL' && m.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [meetings, filterDept, filterStatus]);

  // Calculate meeting duration string
  const getDurationString = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let diffMinutes = eh * 60 + em - (sh * 60 + sm);
      if (diffMinutes < 0) diffMinutes += 24 * 60;
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      if (hours === 0) return `${mins} mins`;
      if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
      return `${hours} hr ${mins} mins`;
    } catch {
      return '1 hr';
    }
  };

  // Export meetings to iCal format (.ics)
  const handleExportICal = () => {
    const calendarEvents = filteredMeetings.map((m) => {
      const startClean = m.date.replace(/-/g, '') + 'T' + m.startTime.replace(/:/g, '') + '00';
      const endClean = m.date.replace(/-/g, '') + 'T' + m.endTime.replace(/:/g, '') + '00';
      return [
        'BEGIN:VEVENT',
        `UID:${m.id}@enactusvips.org`,
        `SUMMARY:${m.title}`,
        `DESCRIPTION:${m.agenda || 'Enactus VIPS-TC Meeting'}`,
        `LOCATION:${m.location}`,
        `DTSTART:${startClean}`,
        `DTEND:${endClean}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ].join('\r\n');
    });

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Enactus VIPS-TC//Society Calendar//EN',
      'CALSCALE:GREGORIAN',
      ...calendarEvents,
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `enactus_calendar_schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    setConflictWarning(null);

    const res = await addMeeting({
      title: formTitle,
      departmentId: formDeptId,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      mode: formMode,
      location: formLocation,
      meetingLink: formLink,
      agenda: formAgenda,
      objectives: 'Coordinate society milestones and strategic deliverables',
      organizerId: currentUser.id,
      attendeeMemberIds: members.slice(0, 8).map((m) => m.id),
    });

    setIsSubmitting(false);

    if (res.success) {
      setShowScheduleModal(false);
      setFormTitle('');
      setFormAgenda('');
      await refreshAll();
    } else if (res.error?.includes('Conflict detected')) {
      setConflictWarning(res.error);
    } else {
      alert(res.error || 'Failed to schedule meeting');
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (confirm('Are you sure you want to cancel this meeting? All attendees will be notified.')) {
      await updateMeeting({ id: meetingId, status: 'Cancelled' });
      await refreshAll();
      setSelectedMeeting((prev) => (prev ? { ...prev, status: 'Cancelled' } : null));
    }
  };

  // Find linked MoM and attendance records for selected meeting
  const linkedMOM = useMemo(() => {
    if (!selectedMeeting) return null;
    return moms.find((m) => m.meetingId === selectedMeeting.id);
  }, [selectedMeeting, moms]);

  const meetingAttendanceRecords = useMemo(() => {
    if (!selectedMeeting) return [];
    return attendance.filter((a) => a.meetingId === selectedMeeting.id);
  }, [selectedMeeting, attendance]);

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <CalendarCheck className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Enactus Operations Sync</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">Calendar & Meetings</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Department syncs, conflict-aware meeting scheduling, attendance rosters, and MoM tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportICal}
            className="flex items-center gap-2 rounded-xl border border-[#E3EBE7] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#263832] hover:bg-[#DDF7EF] hover:border-[#2FC3A5] transition shadow-sm"
          >
            <Download className="h-4 w-4 text-[#2FC3A5]" />
            <span>Export iCal (.ics)</span>
          </button>

          {permissions.canScheduleMeetings && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Meeting</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 lg:col-span-2">
          <Filter className="h-4 w-4 text-[#2FC3A5] shrink-0" />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
          >
            <option value="ALL">All Departments & Society Syncs</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-[#637d74] font-medium px-2">
          <span>{filteredMeetings.length} Meeting(s) on file</span>
        </div>
      </div>

      {/* Meeting Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeetings.map((meet) => {
          const dept = departments.find((d) => d.id === meet.departmentId);
          const organizer = members.find((m) => m.id === meet.organizerId);
          const duration = getDurationString(meet.startTime, meet.endTime);
          const hasMoM = moms.some((m) => m.meetingId === meet.id);

          return (
            <div
              key={meet.id}
              onClick={() => setSelectedMeeting(meet)}
              className={`rounded-2xl border p-5 shadow-sm transition cursor-pointer flex flex-col justify-between ${
                meet.status === 'Cancelled'
                  ? 'border-red-200 bg-red-50/30 opacity-70'
                  : 'border-[#E3EBE7] bg-white hover:border-[#2FC3A5] hover:shadow'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2.5">
                  <span
                    className="font-bold flex items-center gap-1.5"
                    style={{ color: dept?.color || '#0D5143' }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dept?.color || '#2FC3A5' }} />
                    {meet.departmentId === 'ALL' ? 'Society Central' : dept?.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {hasMoM && (
                      <span className="rounded-full bg-[#E7F3D7] text-[#0D5143] px-2 py-0.5 text-[9px] font-bold flex items-center gap-1">
                        <FileText className="h-2.5 w-2.5" />
                        MoM Logged
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                        meet.status === 'Scheduled'
                          ? 'bg-[#E7F3D7] text-[#0D5143]'
                          : meet.status === 'Completed'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {meet.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#263832] group-hover:text-[#2FC3A5] transition">
                  {meet.title}
                </h3>

                <p className="mt-2 text-xs text-[#637d74] line-clamp-2">
                  {meet.agenda || 'Standard synchronization and milestone review'}
                </p>

                <div className="mt-3.5 space-y-1.5 text-xs text-[#263832]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#2FC3A5] shrink-0" />
                    <span>{meet.date} • {meet.startTime} - {meet.endTime} ({duration})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {meet.mode === 'Online' ? (
                      <Video className="h-3.5 w-3.5 text-[#2FC3A5] shrink-0" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    )}
                    <span className="truncate text-[#637d74]">{meet.mode}: {meet.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E3EBE7] flex items-center justify-between text-[11px]">
                <span className="text-[#8a9e96]">
                  Host: <strong className="text-[#263832]">{organizer?.name || 'HR Lead'}</strong>
                </span>

                <span className="text-[#2FC3A5] font-bold flex items-center gap-1 hover:underline">
                  <span>View Details</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Meeting Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#E3EBE7] bg-white p-6 md:p-8 shadow-2xl">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-[#E3EBE7] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#E7F3D7] text-[#0D5143] px-3 py-1 text-xs font-bold">
                  {selectedMeeting.departmentId === 'ALL' ? 'Society Central' : selectedMeeting.departmentId}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    selectedMeeting.status === 'Scheduled'
                      ? 'bg-[#E7F3D7] text-[#0D5143]'
                      : selectedMeeting.status === 'Completed'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {selectedMeeting.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="text-[#8a9e96] hover:text-[#263832] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-[#263832]">{selectedMeeting.title}</h2>

            {/* Quick Metrics Banner */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-center">
                <div className="text-[10px] font-semibold text-[#8a9e96] uppercase">Date</div>
                <div className="text-xs font-bold text-[#263832] mt-0.5">{selectedMeeting.date}</div>
              </div>
              <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-center">
                <div className="text-[10px] font-semibold text-[#8a9e96] uppercase">Duration</div>
                <div className="text-xs font-bold text-[#2FC3A5] mt-0.5">
                  {getDurationString(selectedMeeting.startTime, selectedMeeting.endTime)}
                </div>
              </div>
              <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-center">
                <div className="text-[10px] font-semibold text-[#8a9e96] uppercase">Mode</div>
                <div className="text-xs font-bold text-[#263832] mt-0.5">{selectedMeeting.mode}</div>
              </div>
              <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-center">
                <div className="text-[10px] font-semibold text-[#8a9e96] uppercase">Attendees</div>
                <div className="text-xs font-bold text-[#0D5143] mt-0.5">
                  {selectedMeeting.attendeeMemberIds?.length || 0} Members
                </div>
              </div>
            </div>

            {/* Meeting Link & Protected Credentials */}
            {selectedMeeting.meetingLink && (
              <div className="mt-4 rounded-2xl border border-[#2FC3A5] bg-[#DDF7EF]/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-[#2FC3A5]" />
                    <span className="text-xs font-bold text-[#0D5143]">Protected Meeting Link</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyMeetingLink(selectedMeeting.meetingLink!)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E3EBE7] text-[11px] font-semibold text-[#263832] hover:bg-[#F7F9F7] transition shadow-xs"
                    >
                      {copiedLink ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <a
                      href={selectedMeeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#2FC3A5] text-white text-[11px] font-bold hover:bg-[#28af94] transition shadow-xs"
                    >
                      <span>Join Room</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="mt-2 text-xs font-mono text-[#263832] truncate bg-white/70 p-2 rounded-xl border border-[#E3EBE7]">
                  {selectedMeeting.meetingLink}
                </div>
              </div>
            )}

            {/* Agenda & Objectives */}
            <div className="mt-4 rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-4 text-xs text-[#263832]">
              <div className="font-bold text-[#0D5143] uppercase text-[10px] tracking-wider mb-1">
                Meeting Agenda & Objectives
              </div>
              <p className="leading-relaxed text-[#263832]">{selectedMeeting.agenda || 'No formal agenda specified.'}</p>
            </div>

            {/* Minutes of Meeting (MoM) Card */}
            <div className="mt-4 rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#2FC3A5]" />
                  <span className="text-xs font-bold text-[#263832]">Minutes of Meeting (MoM)</span>
                </div>
                {linkedMOM ? (
                  <Link
                    href={`/moms`}
                    className="text-xs font-bold text-[#2FC3A5] hover:underline flex items-center gap-1"
                  >
                    <span>View MoM Record</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  permissions.canCreateMOM && (
                    <Link
                      href={`/moms`}
                      className="px-2.5 py-1 rounded-lg bg-[#2FC3A5] text-white text-[11px] font-bold hover:bg-[#28af94] transition shadow-xs"
                    >
                      + Draft MoM
                    </Link>
                  )
                )}
              </div>

              {linkedMOM ? (
                <div className="text-xs space-y-1.5 text-[#637d74] bg-[#F7F9F7] p-3 rounded-xl border border-[#E3EBE7]">
                  <div className="text-[#263832] font-semibold">{linkedMOM.title}</div>
                  <div className="flex items-center gap-4 text-[11px] pt-1 text-[#8a9e96]">
                    <span>{linkedMOM.actionItems?.length || 0} Action Items</span>
                    <span>{linkedMOM.decisionsMade?.length || 0} Decisions Logged</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#8a9e96] italic">
                  Minutes have not been documented for this session yet.
                </p>
              )}
            </div>

            {/* Attendance Roster Summary */}
            <div className="mt-4 rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#2FC3A5]" />
                  <span className="text-xs font-bold text-[#263832]">
                    Meeting Attendance ({meetingAttendanceRecords.length} records)
                  </span>
                </div>
                <Link
                  href={`/attendance`}
                  className="text-xs font-bold text-[#2FC3A5] hover:underline"
                >
                  Manage Attendance
                </Link>
              </div>

              {meetingAttendanceRecords.length === 0 ? (
                <p className="text-xs text-[#8a9e96] italic">
                  Attendance roll has not been taken for this session yet.
                </p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {meetingAttendanceRecords.slice(0, 6).map((rec) => {
                    const member = members.find((m) => m.id === rec.memberId);
                    return (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#F7F9F7] border border-[#E3EBE7]"
                      >
                        <span className="font-semibold text-[#263832]">{member?.name || rec.memberId}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            rec.status === 'Present'
                              ? 'bg-[#E7F3D7] text-[#0D5143]'
                              : rec.status === 'Late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cancellation Controls */}
            {permissions.canScheduleMeetings && selectedMeeting.status === 'Scheduled' && (
              <div className="mt-6 flex justify-end gap-2 border-t border-[#E3EBE7] pt-4">
                <button
                  onClick={() => handleCancelMeeting(selectedMeeting.id)}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition"
                >
                  Cancel Meeting
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#E3EBE7] bg-white p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E3EBE7] pb-3 mb-4">
              <h3 className="text-base font-bold text-[#263832]">Schedule Society / Department Meeting</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-[#8a9e96] hover:text-[#263832]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {conflictWarning && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>{conflictWarning}</div>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Meeting Title *</label>
                  <input
                    required
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Weekly Production Review"
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Department *</label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  >
                    <option value="ALL">Entire Society (All Departments)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Date *</label>
                  <input
                    required
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Start Time *</label>
                  <input
                    required
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">End Time *</label>
                  <input
                    required
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Meeting Mode</label>
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  >
                    <option value="Online">Online (Google Meet / Zoom)</option>
                    <option value="Offline">Offline (Campus Venue)</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Location / Venue</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Conference Room 301 or Google Meet"
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Meeting Link (Google Meet / Zoom)</label>
                <input
                  type="url"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Meeting Agenda</label>
                <textarea
                  rows={3}
                  value={formAgenda}
                  onChange={(e) => setFormAgenda(e.target.value)}
                  placeholder="Topics to discuss, expected outcomes..."
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#637d74] hover:bg-[#F7F9F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#2FC3A5] px-5 py-2 text-xs font-bold text-white hover:bg-[#28af94] transition shadow-sm"
                >
                  {isSubmitting ? 'Checking Conflicts...' : 'Schedule & Notify Attendees'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
