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
  const { departments, members, events, announcements, addEvent, updateEvent, addAnnouncement, refreshAll } = useData();

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
      await refreshAll();
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
      await refreshAll();
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
    await refreshAll();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <Megaphone className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Notices & Events</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">Noticeboard & Society Events</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Society-wide notices, competition preparation bootcamps, community expos, and event checklists
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canPostAnnouncements && (
            <>
              <button
                onClick={() => setShowNoticeModal(true)}
                className="flex items-center gap-2 rounded-xl border border-[#E3EBE7] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#263832] hover:bg-[#DDF7EF] hover:border-[#2FC3A5] transition shadow-sm"
              >
                <Plus className="h-4 w-4 text-[#2FC3A5]" />
                <span>Post Notice</span>
              </button>
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center gap-2 rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Event</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E3EBE7]">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
            activeTab === 'announcements'
              ? 'border-[#2FC3A5] text-[#2FC3A5]'
              : 'border-transparent text-[#637d74] hover:text-[#263832]'
          }`}
        >
          Official Announcements ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
            activeTab === 'events'
              ? 'border-[#2FC3A5] text-[#2FC3A5]'
              : 'border-transparent text-[#637d74] hover:text-[#263832]'
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
                className={`rounded-2xl border p-5 shadow-sm transition ${
                  ann.isPinned
                    ? 'border-[#2FC3A5] bg-[#DDF7EF]/30 ring-1 ring-[#2FC3A5]/20'
                    : 'border-[#E3EBE7] bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#263832]">{ann.title}</h3>
                      {ann.isPinned && (
                        <span className="flex items-center gap-1 rounded-full bg-[#E7F3D7] px-2.5 py-0.5 text-[10px] font-bold text-[#0D5143]">
                          <Pin className="h-3 w-3 text-[#2FC3A5]" />
                          <span>Pinned</span>
                        </span>
                      )}
                      {ann.priority === 'Urgent' && (
                        <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-[10px] font-bold">
                          Urgent Notice
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#2FC3A5] font-semibold mt-1">
                      {ann.departmentId === 'ALL' ? 'Society-Wide Announcement' : `Department: ${ann.departmentId}`}
                    </div>
                  </div>

                  <span className="text-[11px] text-[#8a9e96] whitespace-nowrap">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="mt-3 text-xs md:text-sm text-[#263832] whitespace-pre-line leading-relaxed">
                  {ann.content}
                </p>

                <div className="mt-4 pt-3 border-t border-[#E3EBE7] flex items-center gap-2 text-xs text-[#637d74]">
                  <span>Posted by:</span>
                  <span className="font-semibold text-[#263832]">{author?.name} ({author?.roleTitle})</span>
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
                className="rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-[#E7F3D7] px-2.5 py-1 text-xs font-bold text-[#0D5143]">
                      {organizingDept?.name || 'Society Event'}
                    </span>
                    <h3 className="text-lg font-bold text-[#263832] mt-2">{evt.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-[#637d74] leading-relaxed">{evt.description}</p>

                <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 space-y-2 text-xs text-[#263832]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#2FC3A5]" />
                    <span>
                      {new Date(evt.startDateTime).toLocaleDateString()} - {new Date(evt.endDateTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    <span>{evt.venue}</span>
                  </div>
                </div>

                {/* Event Prep Checklist */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#637d74] mb-2">
                    Preparation Checklist
                  </h4>
                  <div className="space-y-1.5">
                    {evt.checklist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleChecklistItem(evt, item.id)}
                        className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-2.5 hover:bg-white hover:border-[#2FC3A5] transition text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            onChange={() => {}}
                            className="rounded text-[#2FC3A5] focus:ring-[#2FC3A5] cursor-pointer"
                          />
                          <span className={item.isCompleted ? 'text-[#8a9e96] line-through' : 'text-[#263832] font-medium'}>
                            {item.task}
                          </span>
                        </div>
                        {item.assignedTo && (
                          <span className="text-[10px] text-[#0D5143] font-semibold bg-[#E7F3D7] px-2 py-0.5 rounded-full">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#263832] mb-1">Publish Notice</h3>
            <p className="text-xs text-[#637d74] mb-4">Official announcement broadcasted to members.</p>

            <form onSubmit={handlePostAnnouncement} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#263832]">Notice Title *</label>
                <input
                  required
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Q4 Townhall Meeting"
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Target Audience</label>
                <select
                  value={annDept}
                  onChange={(e) => setAnnDept(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                >
                  <option value="ALL">All Society Members</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Notice Content *</label>
                <textarea
                  required
                  rows={4}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Full announcement text..."
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div className="flex items-center gap-4 text-xs text-[#263832]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={annPinned}
                    onChange={(e) => setAnnPinned(e.target.checked)}
                    className="rounded text-[#2FC3A5] focus:ring-[#2FC3A5]"
                  />
                  <span>Pin to top of Dashboard</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={annPriority === 'Urgent'}
                    onChange={(e) => setAnnPriority(e.target.checked ? 'Urgent' : 'Normal')}
                    className="rounded text-red-500 focus:ring-red-500"
                  />
                  <span>Mark as Urgent</span>
                </label>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#637d74] hover:bg-[#F7F9F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPostingAnn}
                  className="rounded-xl bg-[#2FC3A5] px-5 py-2 text-xs font-bold text-white hover:bg-[#28af94] transition shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#263832] mb-1">Create Society Event</h3>
            <p className="text-xs text-[#637d74] mb-4">Set up event with organizing department and checklist.</p>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#263832]">Event Title *</label>
                <input
                  required
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Enactus National Expo BootCamp"
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Organizing Department *</label>
                <select
                  value={eventDept}
                  onChange={(e) => setEventDept(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Campus Venue *</label>
                <input
                  required
                  type="text"
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  placeholder="e.g. VIPS Main Auditorium"
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Description</label>
                <textarea
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Event itinerary, objectives, and audience..."
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#637d74] hover:bg-[#F7F9F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPostingEvent}
                  className="rounded-xl bg-[#2FC3A5] px-5 py-2 text-xs font-bold text-white hover:bg-[#28af94] transition shadow-sm"
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
