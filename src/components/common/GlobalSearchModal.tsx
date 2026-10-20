'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import {
  Search,
  X,
  Users,
  FileText,
  Calendar,
  CheckSquare,
  Building2,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const { members, departments, meetings, moms, tasks } = useData();
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredMembers = q
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.memberId.toLowerCase().includes(q) ||
          m.roleTitle.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const filteredMOMs = q
    ? moms.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.agenda.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const filteredMeetings = q
    ? meetings.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.agenda.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const filteredTasks = q
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const filteredDepts = q
    ? departments.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const totalResults =
    filteredMembers.length +
    filteredMOMs.length +
    filteredMeetings.length +
    filteredTasks.length +
    filteredDepts.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16 backdrop-blur-sm sm:pt-24 animate-fadeIn">
      <div className="w-full max-w-2xl rounded-3xl border border-[#E3EBE7] bg-white shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-[#E3EBE7] px-4 py-3 bg-[#F7F9F7]">
          <Search className="h-5 w-5 text-[#2FC3A5]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything: 'Aarav', 'Expo', 'MoM', 'Attendance', 'Finance'..."
            autoFocus
            className="flex-1 bg-transparent px-3 text-sm text-[#263832] placeholder-[#8a9e96] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#8a9e96] hover:text-[#263832]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 rounded-lg bg-white border border-[#E3EBE7] px-2 py-1 text-xs text-[#637d74] hover:text-[#263832]"
          >
            Esc
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!q ? (
            <div className="py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-[#8a9e96] mb-2" />
              <p className="text-sm font-medium text-[#637d74]">
                Type a name, role, department, or keyword to search across Enactus VIPS-TC records.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['President', 'Digital Operations', 'Attendance', 'MoM', 'Secondary HR'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="rounded-full border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1 text-xs text-[#637d74] hover:border-[#2FC3A5] hover:text-[#2FC3A5] transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-sm text-[#8a9e96]">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {/* Members */}
              {filteredMembers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0D5143] mb-2">
                    <Users className="h-3.5 w-3.5 text-[#2FC3A5]" />
                    <span>Members ({filteredMembers.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredMembers.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleNavigate(`/members`)}
                        className="flex cursor-pointer items-center justify-between rounded-xl p-2.5 hover:bg-[#F7F9F7] transition"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="h-8 w-8 rounded-full object-cover border border-[#E3EBE7]"
                          />
                          <div>
                            <div className="text-sm font-semibold text-[#263832]">{m.name}</div>
                            <div className="text-xs text-[#637d74]">
                              {m.roleTitle} • {m.memberId}
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#E7F3D7] px-2.5 py-0.5 text-[10px] font-bold text-[#0D5143]">
                          {m.primaryDepartmentId}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MOMs */}
              {filteredMOMs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0D5143] mb-2">
                    <FileText className="h-3.5 w-3.5 text-[#2FC3A5]" />
                    <span>Meeting Minutes ({filteredMOMs.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredMOMs.map((mom) => (
                      <div
                        key={mom.id}
                        onClick={() => handleNavigate(`/moms`)}
                        className="cursor-pointer rounded-xl p-2.5 hover:bg-[#F7F9F7] transition"
                      >
                        <div className="flex items-center justify-between text-sm font-medium text-[#263832]">
                          <span>{mom.title}</span>
                          <span className="text-xs text-[#8a9e96]">{mom.meetingDate}</span>
                        </div>
                        <div className="text-xs text-[#637d74] truncate mt-0.5">
                          {mom.agenda || 'Meeting Minutes record'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meetings */}
              {filteredMeetings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0D5143] mb-2">
                    <Calendar className="h-3.5 w-3.5 text-[#2FC3A5]" />
                    <span>Meetings & Calendar ({filteredMeetings.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredMeetings.map((meet) => (
                      <div
                        key={meet.id}
                        onClick={() => handleNavigate(`/calendar`)}
                        className="cursor-pointer rounded-xl p-2.5 hover:bg-[#F7F9F7] transition"
                      >
                        <div className="flex items-center justify-between text-sm font-medium text-[#263832]">
                          <span>{meet.title}</span>
                          <span className="text-xs text-[#2FC3A5] font-semibold">{meet.date} {meet.startTime}</span>
                        </div>
                        <div className="text-xs text-[#637d74] truncate mt-0.5">
                          {meet.mode} • {meet.location}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {filteredTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0D5143] mb-2">
                    <CheckSquare className="h-3.5 w-3.5 text-[#2FC3A5]" />
                    <span>Tasks ({filteredTasks.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleNavigate(`/tasks`)}
                        className="cursor-pointer rounded-xl p-2.5 hover:bg-[#F7F9F7] transition"
                      >
                        <div className="flex items-center justify-between text-sm font-medium text-[#263832]">
                          <span>{t.title}</span>
                          <span className="rounded-full bg-[#E7F3D7] px-2 py-0.5 text-[10px] text-[#0D5143] font-bold">
                            {t.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#637d74] mt-0.5">
                          Category: {t.category} • Deadline: {t.deadline}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Departments */}
              {filteredDepts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0D5143] mb-2">
                    <Building2 className="h-3.5 w-3.5 text-[#2FC3A5]" />
                    <span>Departments ({filteredDepts.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredDepts.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => handleNavigate(`/departments`)}
                        className="cursor-pointer rounded-xl p-2.5 hover:bg-[#F7F9F7] transition flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-[#263832]">{d.name}</span>
                        <span className="text-xs text-[#637d74] truncate max-w-xs">{d.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
