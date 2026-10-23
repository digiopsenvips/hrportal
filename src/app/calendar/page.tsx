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
  CalendarDays,
  ListFilter,
  Eye,
} from 'lucide-react';

export type CalendarViewType = 'day' | 'week' | 'month' | 'year' | 'agenda';

export default function CalendarPage() {
  const { currentUser } = useAuth();
  const { departments, members, meetings, moms, attendance } = useData();

  // Filters and views
  const [filterDept, setFilterDept] = useState('ALL');
  const [calendarView, setCalendarView] = useState<CalendarViewType>('week');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active anchor date for calendar navigation
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Calculate Monday of current week for week view
  const currentWeekMonday = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    // Monday is 1, Sunday is 0 -> diff to previous Monday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [currentDate]);

  // Calculate 7 days for the current week (Monday -> Sunday)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekMonday);
      d.setDate(currentWeekMonday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekMonday]);

  // Filter meetings by department
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (filterDept !== 'ALL' && m.departmentId !== filterDept && m.departmentId !== 'ALL') {
        return false;
      }
      return true;
    });
  }, [meetings, filterDept]);

  // Map of meetings indexed by date string (YYYY-MM-DD) for fast lookup
  const meetingsByDate = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    filteredMeetings.forEach((m) => {
      const list = map.get(m.date) || [];
      list.push(m);
      map.set(m.date, list);
    });
    // Sort meetings in each day by start time
    map.forEach((list) => {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
  }, [filteredMeetings]);

  // Navigation handlers tailored to the active view
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (calendarView === 'day') {
        d.setDate(d.getDate() - 1);
      } else if (calendarView === 'week') {
        d.setDate(d.getDate() - 7);
      } else if (calendarView === 'month' || calendarView === 'agenda') {
        d.setMonth(d.getMonth() - 1);
      } else if (calendarView === 'year') {
        d.setFullYear(d.getFullYear() - 1);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (calendarView === 'day') {
        d.setDate(d.getDate() + 1);
      } else if (calendarView === 'week') {
        d.setDate(d.getDate() + 7);
      } else if (calendarView === 'month' || calendarView === 'agenda') {
        d.setMonth(d.getMonth() + 1);
      } else if (calendarView === 'year') {
        d.setFullYear(d.getFullYear() + 1);
      }
      return d;
    });
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(today);
  };

  // Header display string based on current view
  const navigationHeaderTitle = useMemo(() => {
    const year = currentDate.getFullYear();
    const monthLong = currentDate.toLocaleDateString('en-US', { month: 'long' });

    if (calendarView === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (calendarView === 'week') {
      const startMonth = weekDays[0].toLocaleDateString('en-US', { month: 'short' });
      const endMonth = weekDays[6].toLocaleDateString('en-US', { month: 'short' });
      const startYear = weekDays[0].getFullYear();
      if (startMonth === endMonth) {
        return `${startMonth} ${weekDays[0].getDate()} – ${weekDays[6].getDate()}, ${startYear}`;
      }
      return `${startMonth} ${weekDays[0].getDate()} – ${endMonth} ${weekDays[6].getDate()}, ${startYear}`;
    }

    if (calendarView === 'month') {
      return `${monthLong} ${year}`;
    }

    if (calendarView === 'year') {
      return `${year}`;
    }

    if (calendarView === 'agenda') {
      return `Agenda — ${monthLong} ${year}`;
    }

    return `${monthLong} ${year}`;
  }, [calendarView, currentDate, weekDays]);

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
      const heightPx = Math.max(34, (durationMinutes / 60) * 64);

      return {
        top: `${topPx}px`,
        height: `${heightPx}px`,
      };
    } catch {
      return { top: '0px', height: '50px' };
    }
  };

  // Duration string helper
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

  // Month grid computation (Monday-start 7-day columns)
  const monthCalendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    let dayOfWeek = firstDay.getDay() - 1; // 0 = Monday, 6 = Sunday
    if (dayOfWeek === -1) dayOfWeek = 6;

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: {
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      meetings: Meeting[];
    }[] = [];

    // Leading days from previous month
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      const dateStr = d.toISOString().slice(0, 10);
      cells.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: new Date().toISOString().slice(0, 10) === dateStr,
        meetings: meetingsByDate.get(dateStr) || [],
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().slice(0, 10);
      cells.push({
        date: d,
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: new Date().toISOString().slice(0, 10) === dateStr,
        meetings: meetingsByDate.get(dateStr) || [],
      });
    }

    // Trailing days from next month to complete standard 35 or 42 grid cells
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let day = 1; day <= remaining; day++) {
        const d = new Date(year, month + 1, day);
        const dateStr = d.toISOString().slice(0, 10);
        cells.push({
          date: d,
          dateStr,
          dayNumber: day,
          isCurrentMonth: false,
          isToday: new Date().toISOString().slice(0, 10) === dateStr,
          meetings: meetingsByDate.get(dateStr) || [],
        });
      }
    }

    return cells;
  }, [currentDate, meetingsByDate]);

  // Year view: 12 months array for the current year
  const yearMonths = useMemo(() => {
    const year = currentDate.getFullYear();
    const months = [];

    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(year, m, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });
      const daysInMonth = new Date(year, m + 1, 0).getDate();

      let startDayOfWeek = monthDate.getDay() - 1;
      if (startDayOfWeek === -1) startDayOfWeek = 6;

      // Collect all meetings in this month
      const monthPrefix = `${year}-${String(m + 1).padStart(2, '0')}`;
      const monthMeetings = filteredMeetings.filter((mtg) => mtg.date.startsWith(monthPrefix));

      // Construct mini-day cells for the month
      const days = [];
      // Empty padding cells
      for (let p = 0; p < startDayOfWeek; p++) {
        days.push(null);
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
        const dayMeetings = meetingsByDate.get(dateStr) || [];
        const isToday = new Date().toISOString().slice(0, 10) === dateStr;
        days.push({
          dayNumber: d,
          dateStr,
          hasMeetings: dayMeetings.length > 0,
          meetingCount: dayMeetings.length,
          isToday,
        });
      }

      months.push({
        monthIndex: m,
        monthName,
        days,
        totalMeetings: monthMeetings.length,
      });
    }
    return months;
  }, [currentDate, filteredMeetings, meetingsByDate]);

  // Linked MoM & Attendance for selected meeting modal
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

  const selectedDateStr = currentDate.toISOString().slice(0, 10);
  const selectedDayMeetings = meetingsByDate.get(selectedDateStr) || [];
  const isSelectedDateToday = new Date().toISOString().slice(0, 10) === selectedDateStr;

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
            Multi-view schedule with Day, Week, Month, Year, and Agenda timelines for Enactus VIPS-TC
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
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-sm">
        {/* Navigation buttons: Today, <, > and current month/range */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={handleToday}
            className="rounded-xl border border-[#E3EBE7] bg-white px-3.5 py-1.5 text-xs font-bold text-[#263832] hover:bg-[#F7F9F7] transition shadow-xs"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="rounded-lg p-1.5 text-[#82918B] hover:bg-[#F7F9F7] hover:text-[#263832] transition"
              title="Previous period"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg p-1.5 text-[#82918B] hover:bg-[#F7F9F7] hover:text-[#263832] transition"
              title="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-sm sm:text-base font-black text-[#263832] ml-2 truncate">
            {navigationHeaderTitle}
          </h2>
        </div>

        {/* View Selector (Day, Week, Month, Year, Agenda) & Department Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* View Selector Buttons */}
          <div className="flex items-center gap-1 rounded-xl bg-[#F7F9F7] p-1 border border-[#E3EBE7]">
            {(['day', 'week', 'month', 'year', 'agenda'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`rounded-lg px-2.5 sm:px-3 py-1 text-xs font-bold capitalize transition ${
                  calendarView === view
                    ? 'bg-white text-[#0D5143] shadow-xs'
                    : 'text-[#82918B] hover:text-[#263832]'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <div className="min-w-[190px]">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5] transition"
            >
              <option value="ALL">All Hubs & Society Syncs</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ==================== 1. DAY VIEW ==================== */}
      {calendarView === 'day' && (
        <div className="overflow-hidden rounded-3xl border border-[#E3EBE7] bg-white shadow-sm">
          {/* Day View Header */}
          <div className="grid grid-cols-12 border-b border-[#E3EBE7] bg-[#F7F9F7]/80">
            <div className="col-span-2 sm:col-span-1 border-r border-[#E3EBE7] p-3 text-center text-[10px] font-bold text-[#82918B] uppercase">
              GMT+5:30
            </div>
            <div
              className={`col-span-10 sm:col-span-11 p-3 text-left flex items-center justify-between ${
                isSelectedDateToday ? 'bg-[#DDF7EF]/40' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#82918B] uppercase">
                  {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                    isSelectedDateToday
                      ? 'bg-[#2FC3A5] text-white shadow-xs'
                      : 'bg-white border border-[#E3EBE7] text-[#263832]'
                  }`}
                >
                  {currentDate.getDate()}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#82918B]">
                {selectedDayMeetings.length} meeting{selectedDayMeetings.length !== 1 ? 's' : ''} scheduled
              </span>
            </div>
          </div>

          {/* Day View Time Grid Body */}
          <div className="max-h-[680px] overflow-y-auto">
            <div className="grid grid-cols-12 relative" style={{ height: `${hours.length * 64}px` }}>
              {/* Time Gutter Axis */}
              <div className="col-span-2 sm:col-span-1 border-r border-[#E3EBE7] bg-[#F7F9F7]/40 relative select-none">
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

              {/* Day Schedule Column */}
              <div
                className={`col-span-10 sm:col-span-11 relative ${
                  isSelectedDateToday ? 'bg-[#DDF7EF]/10' : ''
                }`}
              >
                {/* Horizontal hour lines */}
                {hours.map((h, i) => (
                  <div
                    key={h.hour}
                    className="absolute w-full border-t border-[#E3EBE7]/50"
                    style={{ top: `${i * 64}px` }}
                  />
                ))}

                {/* Scheduled Meetings */}
                {selectedDayMeetings.map((m) => {
                  const blockStyle = getMeetingBlockStyle(m.startTime, m.endTime);
                  const dept = departments.find((d) => d.id === m.departmentId);

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMeeting(m)}
                      style={blockStyle}
                      className="absolute inset-x-2 cursor-pointer rounded-2xl border border-[#2FC3A5] bg-[#E7F3D7] p-3 text-left shadow-xs hover:bg-[#DDF7EF] hover:border-[#0D5143] hover:shadow-md transition overflow-hidden z-10 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-xs text-[#0D5143]">{m.title}</div>
                          <div className="text-[11px] text-[#263832] font-mono mt-0.5">
                            {m.startTime} – {m.endTime} ({getDurationString(m.startTime, m.endTime)})
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#0D5143] border border-[#2FC3A5]/30">
                          {dept ? dept.name : 'Society Sync'}
                        </span>
                      </div>
                      {m.agenda && (
                        <div className="text-[11px] text-[#637d74] truncate mt-1">
                          Agenda: {m.agenda}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. WEEK VIEW (GOOGLE CALENDAR 7-DAY GRID) ==================== */}
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
                  onClick={() => {
                    setCurrentDate(day);
                    setCalendarView('day');
                  }}
                  className={`border-r border-[#E3EBE7] p-2 text-center last:border-r-0 cursor-pointer hover:bg-[#DDF7EF]/30 transition ${
                    isToday ? 'bg-[#DDF7EF]/40' : ''
                  }`}
                  title="Click to view single day"
                >
                  <div className="text-[10px] font-bold text-[#82918B] uppercase">{dayName}</div>
                  <div
                    className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                      isToday ? 'bg-[#2FC3A5] text-white shadow-xs' : 'text-[#263832]'
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
                const dayMeetings = meetingsByDate.get(dayDateStr) || [];

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

      {/* ==================== 3. MONTH VIEW ==================== */}
      {calendarView === 'month' && (
        <div className="overflow-hidden rounded-3xl border border-[#E3EBE7] bg-white shadow-sm">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-[#E3EBE7] bg-[#F7F9F7]/80 text-center text-xs font-bold text-[#82918B] py-2.5">
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
            <div>SUN</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#E3EBE7]">
            {monthCalendarGrid.map((cell, idx) => (
              <div
                key={idx}
                className={`min-h-[110px] sm:min-h-[125px] p-2 flex flex-col justify-between transition ${
                  cell.isCurrentMonth ? 'bg-white' : 'bg-[#F7F9F7]/50 text-[#82918B]'
                } ${cell.isToday ? 'bg-[#DDF7EF]/20' : ''}`}
              >
                {/* Cell Header: Date Number */}
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => {
                      setCurrentDate(cell.date);
                      setCalendarView('day');
                    }}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition hover:bg-[#2FC3A5] hover:text-white ${
                      cell.isToday
                        ? 'bg-[#2FC3A5] text-white shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-[#263832]'
                        : 'text-[#82918B]'
                    }`}
                    title="Click to view day"
                  >
                    {cell.dayNumber}
                  </button>

                  {cell.meetings.length > 0 && (
                    <span className="text-[10px] font-bold text-[#0D5143] bg-[#E7F3D7] px-1.5 py-0.2 rounded-md">
                      {cell.meetings.length}
                    </span>
                  )}
                </div>

                {/* Meeting entries */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {cell.meetings.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMeeting(m)}
                      className="cursor-pointer truncate rounded-lg border border-[#2FC3A5]/40 bg-[#E7F3D7] px-1.5 py-0.5 text-[10px] font-semibold text-[#0D5143] hover:bg-[#DDF7EF] hover:border-[#0D5143] transition"
                      title={`${m.startTime} ${m.title}`}
                    >
                      <span className="font-mono text-[9px] mr-1">{m.startTime}</span>
                      <span>{m.title}</span>
                    </div>
                  ))}

                  {cell.meetings.length > 3 && (
                    <button
                      onClick={() => {
                        setCurrentDate(cell.date);
                        setCalendarView('day');
                      }}
                      className="text-[10px] font-bold text-[#0D5143] hover:underline block text-left"
                    >
                      +{cell.meetings.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 4. YEAR VIEW (12 MONTHS MINI-CALENDARS) ==================== */}
      {calendarView === 'year' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {yearMonths.map((m) => (
            <div
              key={m.monthIndex}
              className="rounded-3xl border border-[#E3EBE7] bg-white p-4 shadow-sm hover:border-[#2FC3A5] transition flex flex-col justify-between"
            >
              <div>
                {/* Month Card Header */}
                <div className="flex items-center justify-between border-b border-[#E3EBE7] pb-2 mb-3">
                  <button
                    onClick={() => {
                      const d = new Date(currentDate.getFullYear(), m.monthIndex, 1);
                      setCurrentDate(d);
                      setCalendarView('month');
                    }}
                    className="font-bold text-sm text-[#263832] hover:text-[#2FC3A5] transition"
                  >
                    {m.monthName}
                  </button>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.totalMeetings > 0
                        ? 'bg-[#E7F3D7] text-[#0D5143]'
                        : 'bg-[#F7F9F7] text-[#82918B]'
                    }`}
                  >
                    {m.totalMeetings} meeting{m.totalMeetings !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Mini Day of Week Header */}
                <div className="grid grid-cols-7 text-center text-[9px] font-bold text-[#82918B] mb-1">
                  <div>M</div>
                  <div>T</div>
                  <div>W</div>
                  <div>T</div>
                  <div>F</div>
                  <div>S</div>
                  <div>S</div>
                </div>

                {/* Mini Day Numbers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                  {m.days.map((d, dIdx) => {
                    if (!d) {
                      return <div key={dIdx} className="h-6" />;
                    }

                    return (
                      <button
                        key={dIdx}
                        onClick={() => {
                          const [y, mo, day] = d.dateStr.split('-').map(Number);
                          setCurrentDate(new Date(y, mo - 1, day));
                          setCalendarView('day');
                        }}
                        className={`h-6 w-full rounded-md flex items-center justify-center transition font-medium relative ${
                          d.isToday
                            ? 'bg-[#2FC3A5] text-white font-bold'
                            : d.hasMeetings
                            ? 'bg-[#E7F3D7] text-[#0D5143] font-bold hover:bg-[#DDF7EF]'
                            : 'text-[#263832] hover:bg-[#F7F9F7]'
                        }`}
                        title={
                          d.hasMeetings
                            ? `${d.meetingCount} meeting(s) on ${d.dateStr}`
                            : d.dateStr
                        }
                      >
                        {d.dayNumber}
                        {d.hasMeetings && !d.isToday && (
                          <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#0D5143]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Month Footer Link */}
              <div className="pt-3 mt-3 border-t border-[#E3EBE7] text-right">
                <button
                  onClick={() => {
                    const d = new Date(currentDate.getFullYear(), m.monthIndex, 1);
                    setCurrentDate(d);
                    setCalendarView('month');
                  }}
                  className="text-[11px] font-bold text-[#2FC3A5] hover:underline"
                >
                  View Month &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== 5. AGENDA / LIST VIEW ==================== */}
      {calendarView === 'agenda' && (
        <div className="space-y-3">
          {filteredMeetings.length === 0 ? (
            <div className="rounded-3xl border border-[#E3EBE7] bg-white p-12 text-center text-xs text-[#82918B]">
              No meetings scheduled matching your filters.
            </div>
          ) : (
            filteredMeetings.map((m) => {
              const dept = departments.find((d) => d.id === m.departmentId);
              const duration = getDurationString(m.startTime, m.endTime);
              const isToday = new Date().toISOString().slice(0, 10) === m.date;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeeting(m)}
                  className={`cursor-pointer rounded-2xl border bg-white p-4 shadow-sm hover:border-[#2FC3A5] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isToday ? 'border-[#2FC3A5]/60 bg-[#E7F3D7]/20' : 'border-[#E3EBE7]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7F3D7] text-[#0D5143] font-bold text-xs shadow-xs">
                      {m.mode === 'Online' ? (
                        <Video className="h-5 w-5 text-[#2FC3A5]" />
                      ) : (
                        <MapPin className="h-5 w-5 text-[#2FC3A5]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#263832]">{m.title}</h4>
                        {isToday && (
                          <span className="rounded-full bg-[#2FC3A5] px-2 py-0.2 text-[9px] font-black text-white">
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#637d74] mt-0.5">
                        {m.date} &bull; {m.startTime} – {m.endTime} ({duration}) &bull; {m.location}
                      </p>
                      {m.agenda && (
                        <p className="text-xs text-[#82918B] mt-1 line-clamp-1">{m.agenda}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="rounded-full bg-[#E7F3D7] px-2.5 py-0.5 text-[10px] font-bold text-[#0D5143]">
                      {dept?.name || 'Society Sync'}
                    </span>
                    <button
                      type="button"
                      className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs font-bold text-[#0D5143] hover:bg-[#DDF7EF] transition"
                    >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E3EBE7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F3D7] text-[#0D5143]">
                  {selectedMeeting.mode === 'Online' ? (
                    <Video className="h-5 w-5 text-[#2FC3A5]" />
                  ) : (
                    <MapPin className="h-5 w-5 text-[#2FC3A5]" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#263832]">{selectedMeeting.title}</h3>
                  <p className="text-xs text-[#637d74]">
                    {selectedMeeting.date} &bull; {selectedMeeting.startTime} – {selectedMeeting.endTime} (
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
                  {selectedMeeting.mode} &bull; {selectedMeeting.location}
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
                    {copiedLink ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-[#2FC3A5]" />
                    )}
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
                      ? `${meetingAttendanceRecords.filter((a) => a.status === 'Present').length}/${
                          meetingAttendanceRecords.length
                        } Present`
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
