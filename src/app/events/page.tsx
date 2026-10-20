'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { SocietyEvent, Announcement } from '@/types';
import {
  Megaphone,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  Pin,
  Users,
  ShieldCheck,
  CheckSquare,
  X,
} from 'lucide-react';

export default function EventsAnnouncementsPage() {
  const { currentUser, permissions } = useAuth();
  const { departments, members, events, announcements, addEvent, updateEvent, addAnnouncement } = useData();

  const [activeTab, setActiveTab] = useState<'announcements' | 'events'>('announcements');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  // Announcement Form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annDept, setAnnDept] = useState('ALL');
  const [annPinned, setAnnPinned] = useState(false);
  const [annPriority, setAnnPriority] = useState<'Normal' | 'Urgent'>('Normal');
  const [isPostingAnn, setIsPostingAnn] = useState(false);

  // Event Form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDept, setEventDept] = useState(departments[0]?.id || 'digital-operations');
  const [eventVenue, setEventVenue] = useState('VIPS Campus Auditorium');
  const [eventStart, setEventStart] = useState('2026-11-05T09:00');
  const [eventEnd, setEventEnd] = useState('2026-11-06T18:00');
  const [eventChecklist, setEventChecklist] = useState<{ task: string; isCompleted: boolean }[]>([
    { task: 'Permissions from Dean Office', isCompleted: true },
    { task: 'Speaker Invitation Letters', isCompleted: false },
  ]);
  const [isPostingEvent, setIsPostingEvent] = useState(false);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsPostingAnn(true);

    const res = await addAnnouncement({
      title: annTitle,
      content: annContent,
      authorId: currentUser.id,
      departmentId: annDept,
      isPinned: annPinned,
      priority: annPriority,
    });

    setIsPostingAnn(false);
    if (res.success) {
      setShowNoticeModal(false);
      setAnnTitle('');
      setAnnContent('');
    } else {
      alert(res.error || 'Failed to post announcement');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsPostingEvent(true);

    const res = await addEvent({
      title: eventTitle,
      description: eventDesc,
      organizingDepartmentId: eventDept,
      supportingHrIds: members.filter((m) => m.role === 'secondary_hr').slice(0, 2).map((m) => m.id),
      organizerIds: [currentUser.id],
      venue: eventVenue,
      startDateTime: new Date(eventStart).toISOString(),
      endDateTime: new Date(eventEnd).toISOString(),
      checklist: eventChecklist,
    });

    setIsPostingEvent(false);
    if (res.success) {
      setShowEventModal(false);
      setEventTitle('');
      setEventDesc('');
    } else {
      alert(res.error || 'Failed to create event');
    }
  };

  const handleToggleChecklistItem = async (event: SocietyEvent, chkId: string) => {
    const updatedChecklist = event.checklist.map((item) =>
      item.id === chkId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    await updateEvent({
      id: event.id,
      checklist: updatedChecklist,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-amber-400" />
            <span>Events & Announcements Noticeboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Society-wide notices, competition preparation bootcamps, community expos, and event checklists
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canPostAnnouncements && (
            <>
              <button
                onClick={() => setShowNoticeModal(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white"
              >
                <Plus className="h-4 w-4 text-amber-400" />
                <span>Post Notice</span>
              </button>
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Event</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
            activeTab === 'announcements'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Official Announcements ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
            activeTab === 'events'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Major Society Events ({events.length})
        </button>
      </div>

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const author = members.find((m) => m.id === ann.authorId);
            return (
              <div
                key={ann.id}
                className={`rounded-2xl border p-5 shadow-lg transition ${
                  ann.isPinned
                    ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 ring-1 ring-amber-400/20'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{ann.title}</h3>
                      {ann.isPinned && (
                        <span className="flex items-center gap-1 rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          <Pin className="h-3 w-3" />
                          <span>Pinned</span>
                        </span>
                      )}
                      {ann.priority === 'Urgent' && (
                        <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                          Urgent Notice
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-amber-400 font-medium mt-1">
                      {ann.departmentId === 'ALL' ? 'Society-Wide Announcement' : `Department: ${ann.departmentId}`}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="mt-3 text-xs md:text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                  {ann.content}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                  <span>Posted by:</span>
                  <span className="font-semibold text-slate-200">{author?.name} ({author?.roleTitle})</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EVENTS TAB */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((evt) => {
            const organizingDept = departments.find((d) => d.id === evt.organizingDepartmentId);

            return (
              <div
                key={evt.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-lg bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-300">
                      {organizingDept?.name || 'Society Event'}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2">{evt.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-300">{evt.description}</p>

                <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <span>
                      {new Date(evt.startDateTime).toLocaleDateString()} - {new Date(evt.endDateTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-400" />
                    <span>{evt.venue}</span>
                  </div>
                </div>

                {/* Event Prep Checklist */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Preparation Checklist
                  </h4>
                  <div className="space-y-1.5">
                    {evt.checklist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleChecklistItem(evt, item.id)}
                        className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-800/30 p-2.5 hover:bg-slate-800/60 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            onChange={() => {}}
                            className="rounded accent-emerald-500 cursor-pointer"
                          />
                          <span className={item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}>
                            {item.task}
                          </span>
                        </div>
                        {item.assignedTo && (
                          <span className="text-[10px] text-amber-400">
                            {members.find((m) => m.id === item.assignedTo)?.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Publish Notice</h3>
            <p className="text-xs text-slate-400 mb-4">Official announcement broadcasted to members.</p>

            <form onSubmit={handlePostAnnouncement} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">Notice Title *</label>
                <input
                  required
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Q4 Townhall Meeting"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Target Audience</label>
                <select
                  value={annDept}
                  onChange={(e) => setAnnDept(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                >
                  <option value="ALL">All Society Members</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300">Notice Content *</label>
                <textarea
                  required
                  rows={4}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Full announcement text..."
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={annPinned}
                    onChange={(e) => setAnnPinned(e.target.checked)}
                    className="accent-amber-400"
                  />
                  <span>Pin to top of Dashboard</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={annPriority === 'Urgent'}
                    onChange={(e) => setAnnPriority(e.target.checked ? 'Urgent' : 'Normal')}
                    className="accent-rose-500"
                  />
                  <span>Mark as Urgent</span>
                </label>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPostingAnn}
                  className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"
                >
                  {isPostingAnn ? 'Broadcasting...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Create Society Event</h3>
            <p className="text-xs text-slate-400 mb-4">Set up event with organizing department and checklist.</p>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">Event Title *</label>
                <input
                  required
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Enactus National Expo BootCamp"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Organizing Department *</label>
                <select
                  value={eventDept}
                  onChange={(e) => setEventDept(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300">Campus Venue *</label>
                <input
                  required
                  type="text"
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  placeholder="e.g. VIPS Main Auditorium"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Event itinerary, objectives, and audience..."
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPostingEvent}
                  className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"
                >
                  {isPostingEvent ? 'Creating...' : 'Launch Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
