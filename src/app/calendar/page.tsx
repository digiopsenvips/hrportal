'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Meeting } from '@/types';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
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
  Layers,
  ChevronDown,
} from 'lucide-react';

export default function CalendarPage() {
  const { currentUser } = useAuth();
  const { departments, members, meetings, moms, attendance } = useData();

  // Filters and views
  const [filterDept, setFilterDept] = useState('ALL');
  const [calendarView, setCalendarView] = useState<'week' | 'month' | 'agenda'>('week');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active anchor date for calendar navigation
  // Default to the first meeting's date or current date
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    // Set to Monday of current week
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Calculate 7 days for the current week (Monday -> Sunday)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekStart]);

  // Navigate Weeks
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  // Filter meetings by department
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (filterDept !== 'ALL' && m.departmentId !== filterDept && m.departmentId !== 'ALL') {
        return false;
      }
      return true;
    });
  }, [meetings, filterDept]);

  // Format header range string
  const weekRangeString = useMemo(() => {
    const startMonth = weekDays[0].toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekDays[6].toLocaleDateString('en-US', { month: 'short' });
    const startYear = weekDays[0].getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${weekDays[0].getDate()} – ${weekDays[6].getDate()}, ${startYear}`;
    }
    return `${startMonth} ${weekDays[0].getDate()} – ${endMonth} ${weekDays[6].getDate()}, ${startYear}`;
  }, [weekDays]);

  // Hours for vertical grid: 08:00 to 22:00
  const hours = useMemo(() => {
    const list = [];
    for (let h = 8; h <= 21; h++) {
      const label = `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
      list.push({ hour: h, label });
    }
    return list;
  }, []);

  // Calculate position and height of meeting in the time grid
  const getMeetingBlockStyle = (startTime: string, endTime: string) => {
    try {
      const [sh, sm] = (startTime || '10:00').split(':').map(Number);
      const [eh, em] = (endTime || '11:00').split(':').map(Number);

      const startMinutesFrom8 = (sh - 8) * 60 + sm;
      const endMinutesFrom8 = (eh - 8) * 60 + em;
      const durationMinutes = Math.max(30, endMinutesFrom8 - startMinutesFrom8);

      // 64px per hour = ~1.066px per minute
      const topPx = Math.max(0, (startMinutesFrom8 / 60) * 64);
      const heightPx = Math.max(32, (durationMinutes / 60) * 64);

      return {
        top: `${topPx}px`,
        height: `${heightPx}px`,
      };
    } catch {
      return { top: '0px', height: '50px' };
    }
  };

  // Duration string
  const getDurationString = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let diffMinutes = eh * 60 + em - (sh * 60 + sm);
      if (diffMinutes < 0) diffMinutes += 24 * 60;
      const hrs = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      if (hrs === 0) return `${mins} mins`;
      if (mins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
      return `${hrs} hr ${mins} mins`;
    } catch {
      return '1 hr';
    }
  };

  // Export iCal (.ics)
  const handleExportICal = () => {
    if (filteredMeetings.length === 0) {
      alert('No meetings available to export.');
      return;
    }

    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Enactus VIPS//Portal Calendar//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n`;

    filteredMeetings.forEach((m) => {
      const cleanDate = m.date.replace(/-/g, '');
      const cleanStart = m.startTime.replace(/:/g, '') + '00';
      const cleanEnd = m.endTime.replace(/:/g, '') + '00';
      icsContent += `BEGIN:VEVENT\nUID:${m.id}@enactusvips.org\nDTSTAMP:${cleanDate}T${cleanStart}Z\nDTSTART:${cleanDate}T${cleanStart}\nDTEND:${cleanDate}T${cleanEnd}\nSUMMARY:${m.title}\nDESCRIPTION:${(m.agenda || '').replace(/\n/g, '\\n')}\nLOCATION:${m.location || 'Google Meet'}\nEND:VEVENT\n`;
    });

    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `enactus_calendar_schedule.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Linked MoM & Attendance for selected meeting
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <CalendarCheck className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Google Calendar Sync View</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">Society Schedule & Meetings</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Weekly 7-day schedule view of authorized department syncs, executive meetings, and milestones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportICal}
            className="flex items-center gap-2 rounded-xl border border-[#E3EBE7] bg-white px-3.5 py-2.5 text-xs font-bold text-[#263832] hover:bg-[#DDF7EF] hover:border-[#2FC3A5] transition shadow-sm"
          >
            <Download className="h-4 w-4 text-[#2FC3A5]" />
            <span>Export iCal (.ics)</span>
          </button>
        </div>
      </div>

      {/* Calendar Controls & Navigation Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-sm">
        {/* Navigation buttons: Today, <, > and current month/range */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleToday}
            className="rounded-xl border border-[#E3EBE7] bg-white px-3 py-1.5 text-xs font-bold text-[#263832] hover:bg-[#F7F9F7] transition shadow-xs"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevWeek}
              className="rounded-lg p-1.5 text-[#82918B] hover:bg-[#F7F9F7] hover:text-[#263832] transition"
              title="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="rounded-lg p-1.5 text-[#82918B] hover:bg-[#F7F9F7] hover:text-[#263832] transition"
              title="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-base font-black text-[#263832] ml-2">{weekRangeString}</h2>
        </div>

        {/* View Toggles & Department Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 rounded-xl bg-[#F7F9F7] p-1 border border-[#E3EBE7]">
            <button
              onClick={() => setCalendarView('week')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                calendarView === 'week'
                  ? 'bg-white text-[#0D5143] shadow-xs'
                  : 'text-[#82918B] hover:text-[#263832]'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCalendarView('agenda')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                calendarView === 'agenda'
                  ? 'bg-white text-[#0D5143] shadow-xs'
                  : 'text-[#82918B] hover:text-[#263832]'
              }`}
            >
              Agenda
            </button>
          </div>

          <div className="min-w-[200px]">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
            >
              <option value="ALL">All Hubs & Society Syncs</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ==================== WEEK VIEW (GOOGLE CALENDAR TIME GRID) ==================== */}
      {calendarView === 'week' && (
        <div className="overflow-hidden rounded-3xl border border-[#E3EBE7] bg-white shadow-sm">
          {/* Calendar Day Header */}
          <div className="grid grid-cols-8 border-b border-[#E3EBE7] bg-[#F7F9F7]/80">
            {/* Time gutter corner */}
            <div className="border-r border-[#E3EBE7] p-3 text-center text-[10px] font-bold text-[#82918B] uppercase">
              GMT+5:30
            </div>

            {/* 7 Day Columns */}
            {weekDays.map((day, idx) => {
              const isToday =
                new Date().toISOString().slice(0, 10) === day.toISOString().slice(0, 10);
              const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
              const dateNum = day.getDate();

              return (
                <div
                  key={idx}
                  className={`border-r border-[#E3EBE7] p-2 text-center last:border-r-0 ${
                    isToday ? 'bg-[#DDF7EF]/40' : ''
                  }`}
                >
                  <div className="text-[10px] font-bold text-[#82918B] uppercase">{dayName}</div>
                  <div
                    className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                      isToday
                        ? 'bg-[#2FC3A5] text-white shadow-xs'
                        : 'text-[#263832]'
                    }`}
                  >
                    {dateNum}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Grid Body */}
          <div className="max-h-[680px] overflow-y-auto">
            <div className="grid grid-cols-8 relative" style={{ height: `${hours.length * 64}px` }}>
              {/* Left Column: Time Axis Labels */}
              <div className="border-r border-[#E3EBE7] bg-[#F7F9F7]/40 relative select-none">
                {hours.map((h, i) => (
                  <div
                    key={h.hour}
                    className="absolute w-full pr-2 text-right text-[10px] font-mono text-[#82918B]"
                    style={{ top: `${i * 64 - 8}px` }}
                  >
                    {h.label}
                  </div>
                ))}
              </div>

              {/* 7 Day Columns with Meeting Blocks */}
              {weekDays.map((day, dayIdx) => {
                const dayDateStr = day.toISOString().slice(0, 10);
                const isToday = new Date().toISOString().slice(0, 10) === dayDateStr;

                // Find all meetings occurring on this day
                const dayMeetings = filteredMeetings.filter((m) => m.date === dayDateStr);

                return (
                  <div
                    key={dayIdx}
                    className={`border-r border-[#E3EBE7] relative last:border-r-0 ${
                      isToday ? 'bg-[#DDF7EF]/10' : ''
                    }`}
                  >
                    {/* Horizontal hour guide lines */}
                    {hours.map((h, i) => (
                      <div
                        key={h.hour}
                        className="absolute w-full border-t border-[#E3EBE7]/50"
                        style={{ top: `${i * 64}px` }}
                      />
                    ))}

                    {/* Scheduled Meeting Blocks */}
                    {dayMeetings.map((m) => {
                      const blockStyle = getMeetingBlockStyle(m.startTime, m.endTime);
                      const dept = departments.find((d) => d.id === m.departmentId);
                      const isCompleted = m.status === 'Completed';

                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMeeting(m)}
                          style={blockStyle}
                          className="absolute inset-x-1 cursor-pointer rounded-xl border border-[#2FC3A5] bg-[#E7F3D7] p-2 text-left shadow-xs hover:bg-[#DDF7EF] hover:border-[#0D5143] hover:shadow-md transition overflow-hidden z-10"
                        >
                          <div className="font-bold text-[11px] text-[#0D5143] truncate leading-tight">
                            {m.title}
                          </div>
                          <div className="text-[10px] text-[#263832] font-mono mt-0.5">
                            {m.startTime} - {m.endTime}
                          </div>
                          <div className="text-[9px] text-[#637d74] truncate mt-0.5">
                            {dept ? dept.name : 'Society Sync'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== AGENDA / LIST VIEW ==================== */}
      {calendarView === 'agenda' && (
        <div className="space-y-3">
          {filteredMeetings.length === 0 ? (
            <div className="rounded-2xl border border-[#E3EBE7] bg-white p-12 text-center text-xs text-[#82918B]">
              No meetings scheduled.
            </div>
          ) : (
            filteredMeetings.map((m) => {
              const dept = departments.find((d) => d.id === m.departmentId);
              const duration = getDurationString(m.startTime, m.endTime);

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeeting(m)}
                  className="cursor-pointer rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-sm hover:border-[#2FC3A5] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F3D7] text-[#0D5143] font-bold text-xs">
                      {m.mode === 'Online' ? <Video className="h-5 w-5 text-[#2FC3A5]" /> : <MapPin className="h-5 w-5 text-[#2FC3A5]" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#263832]">{m.title}</h4>
                      <p className="text-xs text-[#637d74] mt-0.5">
                        {m.date} • {m.startTime} - {m.endTime} ({duration}) • {m.location}
                      </p>
                      <p className="text-xs text-[#82918B] mt-1 line-clamp-1">{m.agenda}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="rounded-full bg-[#E7F3D7] px-2.5 py-0.5 text-[10px] font-bold text-[#0D5143]">
                      {dept?.name || 'Society Sync'}
                    </span>
                    <button className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs font-bold text-[#0D5143] hover:bg-[#DDF7EF]">
                      Inspect
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ==================== MEETING DETAILS MODAL ==================== */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E3EBE7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F3D7] text-[#0D5143]">
                  {selectedMeeting.mode === 'Online' ? <Video className="h-5 w-5 text-[#2FC3A5]" /> : <MapPin className="h-5 w-5 text-[#2FC3A5]" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#263832]">{selectedMeeting.title}</h3>
                  <p className="text-xs text-[#637d74]">
                    {selectedMeeting.date} • {selectedMeeting.startTime} - {selectedMeeting.endTime} (
                    {getDurationString(selectedMeeting.startTime, selectedMeeting.endTime)})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="rounded-full p-1 text-[#82918B] hover:bg-[#F7F9F7] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Details Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                <div className="text-[10px] font-bold text-[#82918B] uppercase">Department</div>
                <div className="font-bold text-[#263832] mt-0.5">
                  {departments.find((d) => d.id === selectedMeeting.departmentId)?.name || 'Society-Wide'}
                </div>
              </div>

              <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                <div className="text-[10px] font-bold text-[#82918B] uppercase">Venue / Mode</div>
                <div className="font-bold text-[#263832] mt-0.5">
                  {selectedMeeting.mode} • {selectedMeeting.location}
                </div>
              </div>

              <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold text-[#82918B] uppercase">Meeting Status</div>
                <div className="font-bold text-[#0D5143] mt-0.5">{selectedMeeting.status}</div>
              </div>
            </div>

            {/* Authorized Link Section */}
            {selectedMeeting.meetingLink && (
              <div className="rounded-2xl border border-[#2FC3A5]/40 bg-[#DDF7EF]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-[#0D5143] uppercase tracking-wider">
                    Authorized Conference Link
                  </div>
                  <div className="font-mono text-xs text-[#263832] truncate mt-0.5">
                    {selectedMeeting.meetingLink}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyMeetingLink(selectedMeeting.meetingLink!)}
                    className="flex items-center gap-1.5 rounded-xl border border-[#2FC3A5] bg-white px-3 py-1.5 text-xs font-bold text-[#0D5143] hover:bg-[#E7F3D7] transition shadow-xs"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-[#2FC3A5]" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={selectedMeeting.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs"
                  >
                    <span>Launch Meet</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Agenda & Objectives */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#263832] uppercase tracking-wider">Agenda</h4>
              <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-xs text-[#263832] whitespace-pre-wrap">
                {selectedMeeting.agenda || 'No formal agenda recorded.'}
              </div>
            </div>

            {/* Linked MoM & Attendance Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-[#E3EBE7] p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#263832]">Minutes of Meeting (MoM)</div>
                  <div className="text-[11px] text-[#637d74]">
                    {linkedMOM ? `Published: "${linkedMOM.title}"` : 'Pending MoM documentation'}
                  </div>
                </div>
                {linkedMOM ? (
                  <Link
                    href={`/moms`}
                    className="rounded-lg bg-[#E7F3D7] px-2.5 py-1 text-xs font-bold text-[#0D5143] hover:bg-[#DDF7EF]"
                  >
                    View MoM
                  </Link>
                ) : (
                  <span className="text-[10px] font-semibold text-[#82918B]">Not recorded</span>
                )}
              </div>

              <div className="rounded-xl border border-[#E3EBE7] p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#263832]">Attendance Roster</div>
                  <div className="text-[11px] text-[#637d74]">
                    {meetingAttendanceRecords.length > 0
                      ? `${meetingAttendanceRecords.filter((a) => a.status === 'Present').length}/${meetingAttendanceRecords.length} Present`
                      : 'No records marked yet'}
                  </div>
                </div>
                <Link
                  href={`/moms?tab=attendance`}
                  className="rounded-lg bg-[#F7F9F7] border border-[#E3EBE7] px-2.5 py-1 text-xs font-bold text-[#263832] hover:bg-[#DDF7EF]"
                >
                  Mark Cards
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
