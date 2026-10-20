'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { MOM, MOMDiscussionPoint, MOMDecision, MOMActionItem, MeetingMode, MOMStatus } from '@/types';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  CheckCircle,
  Clock,
  Lock,
  User,
  Calendar,
  Building2,
  ChevronDown,
  Edit,
  Save,
  Send,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';

export default function MOMsPage() {
  const { currentUser, permissions } = useAuth();
  const { departments, members, meetings, moms, tasks, addMOM, updateMOM, refreshAll } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<MOMStatus | 'ALL'>('ALL');
  const [selectedMOM, setSelectedMOM] = useState<MOM | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // MOM Create/Edit Form State
  const [formMeetingId, setFormMeetingId] = useState('');
  const [formDeptId, setFormDeptId] = useState(departments[0]?.id || 'digital-operations');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formStartTime, setFormStartTime] = useState('15:00');
  const [formEndTime, setFormEndTime] = useState('16:30');
  const [formType, setFormType] = useState<MeetingMode>('Online');
  const [formLocation, setFormLocation] = useState('Google Meet');
  const [formAgenda, setFormAgenda] = useState('');
  const [formObjectives, setFormObjectives] = useState('');
  const [formAttendees, setFormAttendees] = useState<string[]>([]);
  const [formDiscussionPoints, setFormDiscussionPoints] = useState<{ topic: string; notes: string }[]>([
    { topic: 'Operational Updates', notes: '' },
  ]);
  const [formDecisions, setFormDecisions] = useState<string[]>(['']);
  const [formActionItems, setFormActionItems] = useState<{ description: string; assigneeId: string; deadline: string }[]>([
    { description: '', assigneeId: members[0]?.id || '', deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) },
  ]);
  const [formPublicationStatus, setFormPublicationStatus] = useState<MOMStatus>('Draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Template autofill
  const handleApplyTemplate = (templateType: string) => {
    if (templateType === 'dept_weekly') {
      setFormTitle(`Department Weekly Sprint: ${departments.find((d) => d.id === formDeptId)?.name || 'Operations'}`);
      setFormAgenda('1. Department sprint deliverables review\n2. Resource bottlenecks and cross-functional dependencies\n3. Next week milestone planning');
      setFormObjectives('Align team on weekly deliverables and clear pending blockers.');
      setFormDiscussionPoints([
        { topic: 'Current Sprint Deliverables', notes: 'Reviewed progress of assigned tasks.' },
        { topic: 'Blockers & Impediments', notes: 'Addressed inter-department dependencies.' },
      ]);
    } else if (templateType === 'core_leadership') {
      setFormTitle('Core Leadership Bi-Weekly Sync');
      setFormAgenda('1. National Exposition presentation status\n2. Q3 Budget and sponsor updates\n3. Departmental compliance review');
      setFormObjectives('Finalize executive decisions for national presentation deck.');
      setFormDiscussionPoints([
        { topic: 'Budget Allocation', notes: 'Approved financial disbursements.' },
        { topic: 'Project Raahat & Vridhi Updates', notes: 'Reviewed impact numbers and vendor reports.' },
      ]);
    }
  };

  // Filter MOM list based on role permissions and status
  const filteredMOMs = moms.filter((mom) => {
    if (mom.publicationStatus === 'Confidential' && !permissions.canViewConfidentialMOMs) {
      return false;
    }
    if (mom.publicationStatus === 'Draft' && permissions.isGeneralMember) {
      return false;
    }

    const matchesSearch =
      mom.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mom.agenda.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mom.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = filterDept === 'ALL' || mom.departmentId === filterDept;
    const matchesStatus = filterStatus === 'ALL' || mom.publicationStatus === filterStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    const payload = {
      meetingId: formMeetingId || `meeting-${Date.now()}`,
      departmentId: formDeptId,
      title: formTitle,
      meetingDate: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      meetingType: formType,
      location: formLocation,
      agenda: formAgenda,
      objectives: formObjectives,
      attendeeMemberIds: formAttendees.length > 0 ? formAttendees : members.slice(0, 5).map((m) => m.id),
      discussionPoints: formDiscussionPoints.filter((dp) => dp.topic.trim()),
      decisionsMade: formDecisions.filter((d) => d.trim()).map((d) => ({ decision: d, rationale: 'Ratified by attendees' })),
      actionItems: formActionItems
        .filter((ai) => ai.description.trim())
        .map((ai) => ({
          description: ai.description,
          assigneeId: ai.assigneeId,
          deadline: ai.deadline,
          status: 'Open',
        })),
      preparedById: currentUser.id,
      publicationStatus: formPublicationStatus,
      isConfidential: formPublicationStatus === 'Confidential',
    };

    const res = await addMOM(payload);
    setIsSubmitting(false);

    if (res.success) {
      setShowCreateModal(false);
      setFormTitle('');
      setFormAgenda('');
      await refreshAll();
    } else {
      alert(res.error || 'Failed to save MOM');
    }
  };

  const handlePublishMOM = async (mom: MOM) => {
    await updateMOM({
      id: mom.id,
      publicationStatus: 'Published',
      reviewedById: currentUser?.id,
    });
    await refreshAll();
    setSelectedMOM((prev) => (prev ? { ...prev, publicationStatus: 'Published' } : null));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <FileText className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Official Records & Governance</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">Minutes of Meeting (MoM)</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Departmental minutes, automated action item task generation, review workflows, and printable records
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canCreateMOM && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              <span>Draft New MoM</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8a9e96]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search MoMs by keyword, agenda, title..."
            className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] pl-9 pr-4 py-2 text-xs text-[#263832] placeholder-[#8a9e96] focus:outline-none focus:border-[#2FC3A5]"
          />
        </div>

        <div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
          >
            <option value="ALL">All Publication Statuses</option>
            <option value="Published">Published (Society-wide)</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Draft">Draft</option>
            <option value="Confidential">Confidential (Leadership Only)</option>
          </select>
        </div>
      </div>

      {/* MOMs Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMOMs.map((mom) => {
          const dept = departments.find((d) => d.id === mom.departmentId);
          const author = members.find((m) => m.id === mom.preparedById);

          return (
            <div
              key={mom.id}
              onClick={() => setSelectedMOM(mom)}
              className="flex flex-col justify-between rounded-2xl border border-[#E3EBE7] bg-white p-5 shadow-sm hover:border-[#2FC3A5] hover:shadow transition cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2.5">
                  <span
                    className="font-bold flex items-center gap-1.5"
                    style={{ color: dept?.color || '#0D5143' }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dept?.color || '#2FC3A5' }} />
                    {dept?.name || mom.departmentId}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                      mom.publicationStatus === 'Published'
                        ? 'bg-[#E7F3D7] text-[#0D5143]'
                        : mom.publicationStatus === 'Pending Review'
                        ? 'bg-amber-100 text-amber-800'
                        : mom.publicationStatus === 'Confidential'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-[#F7F9F7] text-[#637d74] border border-[#E3EBE7]'
                    }`}
                  >
                    {mom.publicationStatus}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#263832] group-hover:text-[#2FC3A5] transition line-clamp-2">
                  {mom.title}
                </h3>

                <p className="mt-2 text-xs text-[#637d74] line-clamp-2">
                  {mom.agenda || 'Standard synchronization discussion points'}
                </p>

                <div className="mt-3.5 flex items-center gap-3 text-[11px] text-[#637d74]">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#2FC3A5]" />
                    <span>{mom.meetingDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#2FC3A5]" />
                    <span>{mom.startTime} - {mom.endTime}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E3EBE7] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-[#8a9e96] truncate max-w-[150px]">
                  <span>By:</span>
                  <span className="text-[#263832] font-semibold truncate">{author?.name || 'HR Team'}</span>
                </div>
                <span className="font-bold text-[#0D5143] bg-[#E7F3D7] px-2 py-0.5 rounded-full text-[10px]">
                  {mom.actionItems.length} Action Items
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Detailed Printable MOM Modal */}
      {selectedMOM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#E3EBE7] bg-white shadow-2xl p-6 md:p-8 scrollbar-thin">
            {/* Modal Actions Bar */}
            <div className="flex items-center justify-between border-b border-[#E3EBE7] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#E7F3D7] text-[#0D5143] px-3 py-1 text-xs font-bold">
                  {departments.find((d) => d.id === selectedMOM.departmentId)?.name}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    selectedMOM.publicationStatus === 'Published'
                      ? 'bg-[#E7F3D7] text-[#0D5143]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedMOM.publicationStatus}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs font-semibold text-[#263832] hover:bg-white transition shadow-xs"
                  title="Print / Save as PDF"
                >
                  <Printer className="h-4 w-4 text-[#2FC3A5]" />
                  <span>Print MoM</span>
                </button>
                {permissions.canPublishMOM && selectedMOM.publicationStatus !== 'Published' && (
                  <button
                    onClick={() => handlePublishMOM(selectedMOM)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#2FC3A5] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#28af94] transition shadow-xs"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve & Publish</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedMOM(null)}
                  className="rounded-full bg-[#F7F9F7] p-1.5 text-[#8a9e96] hover:text-[#263832] transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="printable-document space-y-6">
              <div className="border-b border-[#E3EBE7] pb-4">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#2FC3A5]">
                  ENACTUS VIPS-TC OFFICIAL MINUTES OF MEETING
                </div>
                <h2 className="mt-1 text-xl md:text-2xl font-black text-[#263832]">{selectedMOM.title}</h2>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#637d74]">
                  <div>Date: <strong className="text-[#263832]">{selectedMOM.meetingDate}</strong></div>
                  <div>Time: <strong className="text-[#263832]">{selectedMOM.startTime} - {selectedMOM.endTime}</strong></div>
                  <div>Mode: <strong className="text-[#263832]">{selectedMOM.meetingType}</strong></div>
                  <div>Venue: <strong className="text-[#263832]">{selectedMOM.location}</strong></div>
                </div>
              </div>

              {/* Agenda & Objectives */}
              <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0D5143]">Meeting Agenda</h4>
                  <p className="mt-1 text-xs text-[#263832] whitespace-pre-line leading-relaxed">{selectedMOM.agenda}</p>
                </div>
                {selectedMOM.objectives && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#2FC3A5]">Meeting Objectives</h4>
                    <p className="mt-1 text-xs text-[#263832]">{selectedMOM.objectives}</p>
                  </div>
                )}
              </div>

              {/* Discussion Points */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#637d74] mb-2">
                  Discussion Points & Deliberations
                </h4>
                <div className="space-y-2">
                  {selectedMOM.discussionPoints.map((dp) => (
                    <div key={dp.id} className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                      <div className="text-xs font-bold text-[#263832]">{dp.topic}</div>
                      <p className="mt-1 text-xs text-[#637d74] leading-relaxed">{dp.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decisions Made */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0D5143] mb-2">
                  Decisions Formally Ratified
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-[#263832]">
                  {selectedMOM.decisionsMade.map((dec) => (
                    <li key={dec.id} className="font-medium text-[#263832]">{dec.decision}</li>
                  ))}
                </ul>
              </div>

              {/* Action Items Generated */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2FC3A5] mb-2">
                  Action Items & Task Ownership (Auto-linked to Task Board)
                </h4>
                <div className="space-y-2">
                  {selectedMOM.actionItems.map((act) => {
                    const assignee = members.find((m) => m.id === act.assigneeId);
                    return (
                      <div
                        key={act.id}
                        className="flex items-center justify-between rounded-xl border border-[#E3EBE7] bg-white p-3 text-xs shadow-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#263832]">{act.description}</div>
                          <div className="text-[10px] text-[#637d74] mt-0.5">
                            Assigned to: <strong className="text-[#0D5143]">{assignee?.name || act.assigneeId}</strong> • Deadline: {act.deadline}
                          </div>
                        </div>
                        <span className="rounded-full bg-[#E7F3D7] text-[#0D5143] px-2.5 py-0.5 text-[10px] font-bold">
                          Active Task
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Authorship and Audit */}
              <div className="border-t border-[#E3EBE7] pt-4 flex flex-col sm:flex-row justify-between text-xs text-[#637d74] gap-2">
                <div>Prepared by: <strong className="text-[#263832]">{members.find((m) => m.id === selectedMOM.preparedById)?.name}</strong></div>
                <div>Reviewed by: <strong className="text-[#263832]">{members.find((m) => m.id === selectedMOM.reviewedById)?.name || 'Pending Review'}</strong></div>
                <div>Created: {new Date(selectedMOM.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New MOM Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#E3EBE7] bg-white p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E3EBE7] pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#263832]">Draft Minutes of Meeting (MoM)</h3>
                <p className="text-xs text-[#637d74]">Action items entered here will automatically spawn real tasks for assignees.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-[#8a9e96] hover:text-[#263832]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-[#637d74] font-medium">Auto-fill Template:</span>
              <button
                type="button"
                onClick={() => handleApplyTemplate('dept_weekly')}
                className="rounded-lg border border-[#E3EBE7] bg-[#F7F9F7] px-2.5 py-1 text-xs font-semibold text-[#0D5143] hover:bg-[#E7F3D7] transition"
              >
                Department Weekly
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('core_leadership')}
                className="rounded-lg border border-[#E3EBE7] bg-[#F7F9F7] px-2.5 py-1 text-xs font-semibold text-[#0D5143] hover:bg-[#E7F3D7] transition"
              >
                Core Leadership Sync
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Meeting Title *</label>
                  <input
                    required
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Digital Ops Architecture Sync"
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
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Meeting Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Start Time</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">End Time</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Mode</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Venue / Online Link</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. Google Meet or Room 402, Block B"
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Meeting Agenda</label>
                <textarea
                  rows={2}
                  value={formAgenda}
                  onChange={(e) => setFormAgenda(e.target.value)}
                  placeholder="Key topics discussed..."
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              {/* Action items generator */}
              <div className="border-t border-[#E3EBE7] pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0D5143]">
                    Action Items (Will Auto-generate Tasks)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormActionItems((prev) => [
                        ...prev,
                        { description: '', assigneeId: members[0]?.id || '', deadline: '' },
                      ])
                    }
                    className="text-[11px] font-bold text-[#2FC3A5] hover:underline"
                  >
                    + Add Action Item
                  </button>
                </div>

                {formActionItems.map((act, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Task description..."
                      value={act.description}
                      onChange={(e) => {
                        const updated = [...formActionItems];
                        updated[idx].description = e.target.value;
                        setFormActionItems(updated);
                      }}
                      className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs text-[#263832] sm:col-span-1 focus:outline-none focus:border-[#2FC3A5]"
                    />
                    <select
                      value={act.assigneeId}
                      onChange={(e) => {
                        const updated = [...formActionItems];
                        updated[idx].assigneeId = e.target.value;
                        setFormActionItems(updated);
                      }}
                      className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.roleTitle})
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={act.deadline}
                      onChange={(e) => {
                        const updated = [...formActionItems];
                        updated[idx].deadline = e.target.value;
                        setFormActionItems(updated);
                      }}
                      className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                    />
                  </div>
                ))}
              </div>

              {/* Publication Status */}
              <div>
                <label className="text-xs font-semibold text-[#263832]">Initial Status</label>
                <select
                  value={formPublicationStatus}
                  onChange={(e) => setFormPublicationStatus(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                >
                  <option value="Draft">Save as Draft</option>
                  <option value="Pending Review">Submit for Review</option>
                  {permissions.canPublishMOM && <option value="Published">Publish Immediately</option>}
                  <option value="Confidential">Mark Confidential (Core Leadership Only)</option>
                </select>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#637d74] hover:bg-[#F7F9F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#2FC3A5] px-5 py-2 text-xs font-bold text-white hover:bg-[#28af94] transition shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Publish Action Items'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
