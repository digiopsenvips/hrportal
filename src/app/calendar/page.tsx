'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

export default function CalendarPage() {
  const { currentUser, permissions } = useAuth();
  const { departments, members, meetings, events, addMeeting, updateMeeting } = useData();

  const [currentDate, setCurrentDate] = useState(new Date('2026-10-21'));
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [filterDept, setFilterDept] = useState('ALL');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

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
  const [formAttendees, setFormAttendees] = useState<string[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (filterDept !== 'ALL' && m.departmentId !== filterDept && m.departmentId !== 'ALL') {
        return false;
      }
      return true;
    });
  }, [meetings, filterDept]);

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
      objectives: 'Coordinate society milestones',
      organizerId: currentUser.id,
      attendeeMemberIds: formAttendees.length > 0 ? formAttendees : members.slice(0, 6).map((m) => m.id),
    });

    setIsSubmitting(false);

    if (res.success) {
      setShowScheduleModal(false);
      setFormTitle('');
      setFormAgenda('');
    } else if (res.error?.includes('Conflict detected')) {
      setConflictWarning(res.error);
    } else {
      alert(res.error || 'Failed to schedule meeting');
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (confirm('Are you sure you want to cancel this meeting? All attendees will be notified.')) {
      await updateMeeting({ id: meetingId, status: 'Cancelled' });
      setSelectedMeeting((prev) => (prev ? { ...prev, status: 'Cancelled' } : null));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-amber-400" />
            <span>Central Calendar & Meeting Scheduler</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Society-wide events, departmental synchronizations, conflict-aware scheduling, and iCal calendar export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportICal}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white"
          >
            <Download className="h-4 w-4 text-amber-400" />
            <span>Export iCal (.ics)</span>
          </button>

          {permissions.canScheduleMeetings && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Meeting</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-amber-400" />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Calendars & Society Syncs</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800 p-1">
          {['month', 'week', 'agenda'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`rounded-lg px-3 py-1 text-xs font-bold uppercase transition ${
                viewMode === mode
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Agenda / Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeetings.map((meet) => {
          const dept = departments.find((d) => d.id === meet.departmentId);
          const organizer = members.find((m) => m.id === meet.organizerId);

          return (
            <div
              key={meet.id}
              onClick={() => setSelectedMeeting(meet)}
              className={`rounded-2xl border p-5 shadow-lg transition cursor-pointer flex flex-col justify-between ${
                meet.status === 'Cancelled'
                  ? 'border-rose-900/40 bg-slate-900/40 opacity-70'
                  : 'border-slate-800 bg-slate-900/80 hover:border-amber-400/60 hover:bg-slate-800/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span
                    className="font-bold flex items-center gap-1.5"
                    style={{ color: dept?.color || '#FFC220' }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dept?.color || '#FFC220' }} />
                    {meet.departmentId === 'ALL' ? 'Society Central' : dept?.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      meet.status === 'Scheduled'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : meet.status === 'Completed'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {meet.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{meet.title}</h3>

                <p className="mt-2 text-xs text-slate-400 line-clamp-2">{meet.agenda}</p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>{meet.date} • {meet.startTime} - {meet.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {meet.mode === 'Online' ? (
                      <Video className="h-3.5 w-3.5 text-blue-400" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5 text-rose-400" />
                    )}
                    <span className="truncate">{meet.mode}: {meet.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  Org: <strong className="text-slate-200">{organizer?.name || 'Leadership'}</strong>
                </span>
                {meet.meetingLink && (
                  <a
                    href={meet.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-blue-400 hover:underline font-semibold"
                  >
                    <span>Join Room</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="rounded-lg bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-300">
                {selectedMeeting.departmentId}
              </span>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-white">{selectedMeeting.title}</h2>

            <div className="mt-4 space-y-2 text-xs text-slate-300">
              <div>Date & Time: <strong className="text-white">{selectedMeeting.date} ({selectedMeeting.startTime} - {selectedMeeting.endTime})</strong></div>
              <div>Mode: <strong className="text-white">{selectedMeeting.mode}</strong></div>
              <div>Venue / Link: <strong className="text-amber-400">{selectedMeeting.location}</strong></div>
              <div>Status: <strong className="text-emerald-400">{selectedMeeting.status}</strong></div>
              <div className="border-t border-slate-800 pt-3">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Agenda</span>
                <p className="mt-1 text-slate-200">{selectedMeeting.agenda}</p>
              </div>
            </div>

            {permissions.canScheduleMeetings && selectedMeeting.status === 'Scheduled' && (
              <div className="mt-6 flex justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  onClick={() => handleCancelMeeting(selectedMeeting.id)}
                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Schedule Society / Department Meeting</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {conflictWarning && (
              <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>{conflictWarning}</div>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300">Meeting Title *</label>
                  <input
                    required
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Weekly Production Review"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300">Department *</label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
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
                  <label className="text-xs text-slate-300">Date *</label>
                  <input
                    required
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300">Start Time *</label>
                  <input
                    required
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300">End Time *</label>
                  <input
                    required
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300">Meeting Mode</label>
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  >
                    <option value="Online">Online (Google Meet / Zoom)</option>
                    <option value="Offline">Offline (Campus Venue)</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300">Location / Venue</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Conference Room 301 or Google Meet"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300">Meeting Link (Optional)</label>
                <input
                  type="url"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Meeting Agenda</label>
                <textarea
                  rows={3}
                  value={formAgenda}
                  onChange={(e) => setFormAgenda(e.target.value)}
                  placeholder="Topics to discuss, expected outcomes..."
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"
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
