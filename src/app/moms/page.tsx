'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import {
  MOM,
  MeetingMode,
  MOMStatus,
  AttendanceStatus,
  AttendanceRecord,
  MOMEditRequest,
  Task,
} from '@/types';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  Lock,
  Unlock,
  User,
  Calendar,
  Building2,
  Edit,
  Save,
  Eye,
  X,
  Sparkles,
  ClipboardCheck,
  Check,
  AlertTriangle,
  History,
  FileSpreadsheet,
  Users,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function MOMsAndAttendancePage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'moms';

  const { currentUser, permissions } = useAuth();
  const {
    departments,
    members,
    meetings,
    moms,
    tasks,
    attendance,
    addMOM,
    updateMOM,
    recordAttendance,
    refreshAll,
  } = useData();

  // Primary Tab State
  const [activeTab, setActiveTab] = useState<'moms' | 'attendance' | 'reports' | 'approvals'>(
    initialTab === 'attendance' ? 'attendance' : initialTab === 'reports' ? 'reports' : 'moms'
  );

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals & Selection
  const [selectedMOM, setSelectedMOM] = useState<MOM | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [editRequestReason, setEditRequestReason] = useState('');
  const [editRequestChanges, setEditRequestChanges] = useState('');
  const [isSubmittingEditReq, setIsSubmittingEditReq] = useState(false);

  // Edit Approvals State (Fetched from server)
  const [editRequests, setEditRequests] = useState<MOMEditRequest[]>([]);
  const [reviewerComment, setReviewerComment] = useState('');
  const [isReviewingReq, setIsReviewingReq] = useState(false);

  // MOM Create/Edit Form State
  const [formMeetingId, setFormMeetingId] = useState('');
  const [formDeptId, setFormDeptId] = useState(departments[0]?.id || 'digital-operations');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formStartTime, setFormStartTime] = useState('15:00');
  const [formEndTime, setFormEndTime] = useState('16:30');
  const [formType, setFormType] = useState<MeetingMode>('Online');
  const [formLocation, setFormLocation] = useState('Google Meet');
  const [formMeetingLink, setFormMeetingLink] = useState('https://meet.google.com/enactus-sync');
  const [formAgenda, setFormAgenda] = useState('');
  const [formObjectives, setFormObjectives] = useState('');
  const [formDiscussionPoints, setFormDiscussionPoints] = useState<{ topic: string; notes: string }[]>([
    { topic: 'Sprint Deliverables Review', notes: '' },
  ]);
  const [formDecisions, setFormDecisions] = useState<string[]>(['']);
  const [formActionItems, setFormActionItems] = useState<{ description: string; assigneeId: string; deadline: string; status: any }[]>([
    { description: '', assigneeId: members[0]?.id || '', deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), status: 'Not Started' },
  ]);
  const [formPublicationStatus, setFormPublicationStatus] = useState<MOMStatus>('Draft');
  const [isSubmittingMOM, setIsSubmittingMOM] = useState(false);
  const [formIsEditing, setFormIsEditing] = useState(false);
  const [editingMomId, setEditingMomId] = useState<string | null>(null);

  // Attendance Interface State
  const [attendanceMeetingId, setAttendanceMeetingId] = useState<string>(meetings[0]?.id || '');
  const [attendanceMemberStates, setAttendanceMemberStates] = useState<Record<string, AttendanceStatus>>({});
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceFilterVertical, setAttendanceFilterVertical] = useState('ALL');
  const [attendanceSource, setAttendanceSource] = useState<'manual' | 'platform' | 'csv'>('manual');

  // Load Edit Requests
  useEffect(() => {
    async function loadRequests() {
      try {
        const res = await fetch('/api/moms');
        if (res.ok) {
          const data = await res.json();
          if (data.editRequests) {
            setEditRequests(data.editRequests);
          }
        }
      } catch (e) {
        // quiet fallback
      }
    }
    loadRequests();
  }, []);

  // When meeting changes in Attendance Interface, initialize members as 'Present' by default
  const selectedMeeting = useMemo(() => {
    return meetings.find((m) => m.id === attendanceMeetingId) || meetings[0];
  }, [meetings, attendanceMeetingId]);

  const departmentMembers = useMemo(() => {
    if (!selectedMeeting) return members;
    if (selectedMeeting.departmentId === 'ALL') {
      return members.filter((m) => m.membershipStatus === 'ACTIVE' && m.approvalStatus === 'APPROVED');
    }
    return members.filter(
      (m) =>
        (m.primaryDepartmentId === selectedMeeting.departmentId ||
          m.assignedDepartmentId === selectedMeeting.departmentId) &&
        m.membershipStatus === 'ACTIVE' &&
        m.approvalStatus === 'APPROVED'
    );
  }, [members, selectedMeeting]);

  useEffect(() => {
    if (!selectedMeeting) return;
    const meetingExistingAtt = attendance.filter((a) => a.meetingId === selectedMeeting.id);
    const initialMap: Record<string, AttendanceStatus> = {};

    departmentMembers.forEach((mem) => {
      const match = meetingExistingAtt.find((a) => a.memberId === mem.id);
      // Default to Present per PDF requirement!
      initialMap[mem.id] = match ? match.status : 'Present';
    });

    setAttendanceMemberStates(initialMap);
  }, [selectedMeeting, departmentMembers, attendance]);

  // Member-card tap interaction: Present -> Absent -> Late -> Present
  const handleToggleAttendanceCard = (memberId: string) => {
    setAttendanceMemberStates((prev) => {
      const current = prev[memberId] || 'Present';
      let next: AttendanceStatus = 'Absent';
      if (current === 'Present') next = 'Absent';
      else if (current === 'Absent') next = 'Late';
      else if (current === 'Late') next = 'Excused';
      else next = 'Present';

      return {
        ...prev,
        [memberId]: next,
      };
    });
  };

  // Live Attendance Counts
  const attendanceCounts = useMemo(() => {
    const total = departmentMembers.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    departmentMembers.forEach((m) => {
      const st = attendanceMemberStates[m.id] || 'Present';
      if (st === 'Present') present++;
      else if (st === 'Absent') absent++;
      else if (st === 'Late') late++;
      else if (st === 'Excused') excused++;
    });

    const percent = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, excused, percent };
  }, [departmentMembers, attendanceMemberStates]);

  // Save Attendance to Server & Audit
  const handleSaveAttendance = async () => {
    if (!currentUser || !selectedMeeting) return;
    setIsSavingAttendance(true);

    const records = departmentMembers.map((m) => ({
      memberId: m.id,
      status: attendanceMemberStates[m.id] || 'Present',
      recordingSource: attendanceSource,
      notes: `${attendanceSource.toUpperCase()} entry marked on ${new Date().toLocaleDateString()}`,
    }));

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: selectedMeeting.id,
          departmentId: selectedMeeting.departmentId,
          markedById: currentUser.id,
          records,
          reason: 'Meeting attendance confirmed via member-card interface',
        }),
      });

      if (res.ok) {
        await refreshAll();
        alert(`Attendance recorded for ${records.length} member(s)!`);
      } else {
        alert('Failed to save attendance record.');
      }
    } catch (e: any) {
      alert(e.message || 'Error saving attendance');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Carry forward unfinished tasks from previous MoM
  const handleCarryForwardTasks = () => {
    const previousMOMs = moms
      .filter((m) => m.departmentId === formDeptId && m.id !== editingMomId)
      .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());

    if (previousMOMs.length === 0) {
      alert('No previous MoM found for this department.');
      return;
    }

    const lastMOM = previousMOMs[0];
    const unfinishedItems = lastMOM.actionItems.filter((ai) => {
      const linkedTask = tasks.find((t) => t.id === ai.taskId);
      return !linkedTask || linkedTask.status !== 'Completed';
    });

    if (unfinishedItems.length === 0) {
      alert('All action items in the previous MoM were completed! No pending tasks to carry over.');
      return;
    }

    const carried = unfinishedItems.map((ui) => ({
      description: `[Carried Over] ${ui.description}`,
      assigneeId: ui.assigneeId,
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: 'In Progress' as any,
    }));

    setFormActionItems((prev) => [...prev.filter((i) => i.description.trim()), ...carried]);
    alert(`Carried forward ${carried.length} unfinished action items from "${lastMOM.title}"!`);
  };

  // Filter MOM list based on role permissions and status
  const filteredMOMs = useMemo(() => {
    return moms.filter((mom) => {
      if (mom.publicationStatus === 'Confidential' && !permissions.canViewConfidentialMOMs) {
        return false;
      }
      // General members view only published MOMs
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
  }, [moms, permissions, searchQuery, filterDept, filterStatus]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormIsEditing(false);
    setEditingMomId(null);
    setFormTitle('');
    setFormAgenda('');
    setFormObjectives('');
    setFormDecisions(['']);
    setFormDiscussionPoints([{ topic: 'Operational Updates', notes: '' }]);
    setFormActionItems([
      { description: '', assigneeId: members[0]?.id || '', deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), status: 'Not Started' },
    ]);
    setFormPublicationStatus('Draft');
    setShowCreateModal(true);
  };

  // Pre-fill from selected scheduled meeting
  const handleSelectPreFillMeeting = (meetId: string) => {
    setFormMeetingId(meetId);
    const m = meetings.find((x) => x.id === meetId);
    if (m) {
      setFormTitle(`${m.title} - Minutes`);
      setFormDeptId(m.departmentId === 'ALL' ? departments[0]?.id || 'digital-operations' : m.departmentId);
      setFormDate(m.date);
      setFormStartTime(m.startTime);
      setFormEndTime(m.endTime);
      setFormType(m.mode);
      setFormLocation(m.location);
      setFormAgenda(m.agenda);
      setFormObjectives(m.objectives || 'Review deliverables and assign sprint action items.');
      if (m.meetingLink) setFormMeetingLink(m.meetingLink);
    }
  };

  // Submit Create or Edit MoM
  const handleSaveMOMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmittingMOM(true);

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
      attendeeMemberIds: members.slice(0, 6).map((m) => m.id),
      discussionPoints: formDiscussionPoints.filter((dp) => dp.topic.trim()),
      decisionsMade: formDecisions.filter((d) => d.trim()).map((d) => ({ decision: d })),
      actionItems: formActionItems
        .filter((ai) => ai.description.trim())
        .map((ai) => ({
          description: ai.description,
          assigneeId: ai.assigneeId,
          deadline: ai.deadline,
          status: ai.status,
        })),
      preparedById: currentUser.id,
      publicationStatus: formPublicationStatus,
    };

    if (formIsEditing && editingMomId) {
      const res = await updateMOM({
        id: editingMomId,
        ...payload,
        editorId: currentUser.id,
        editorNote: 'Content updated via 2-key authorized session',
      });
      setIsSubmittingMOM(false);
      if (res.success) {
        setShowCreateModal(false);
        await refreshAll();
        alert('MOM updated successfully!');
      } else {
        alert(res.error || 'Failed to update MOM');
      }
    } else {
      const res = await addMOM(payload);
      setIsSubmittingMOM(false);
      if (res.success) {
        setShowCreateModal(false);
        await refreshAll();
        alert(`MOM created as ${formPublicationStatus}!`);
      } else {
        alert(res.error || 'Failed to create MOM');
      }
    }
  };

  // Submit Edit Request (2-Key approval)
  const handleSubmitEditRequest = async () => {
    if (!currentUser || !selectedMOM) return;
    if (!editRequestReason.trim()) {
      alert('A mandatory reason is required to request editing a published MOM.');
      return;
    }

    setIsSubmittingEditReq(true);
    try {
      const res = await fetch('/api/moms/edit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          momId: selectedMOM.id,
          reason: editRequestReason,
          proposedChanges: editRequestChanges,
          userId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Edit request submitted! The Department Head has been notified to review and approve.');
        setShowEditRequestModal(false);
        setEditRequestReason('');
        setEditRequestChanges('');
        await refreshAll();
      } else {
        alert(data.error || 'Failed to submit edit request');
      }
    } catch (e: any) {
      alert(e.message || 'Error submitting edit request');
    } finally {
      setIsSubmittingEditReq(false);
    }
  };

  // Review Edit Request (HOD action)
  const handleReviewEditRequest = async (requestId: string, status: 'Approved' | 'Rejected') => {
    if (!currentUser) return;
    setIsReviewingReq(true);

    try {
      const res = await fetch('/api/moms/edit-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status,
          reviewerComment,
          reviewerId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Request ${status.toLowerCase()} successfully!`);
        setReviewerComment('');
        await refreshAll();
        // Update local request list
        setEditRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status } : r))
        );
      } else {
        alert(data.error || 'Failed to review edit request');
      }
    } catch (e: any) {
      alert(e.message || 'Error reviewing edit request');
    } finally {
      setIsReviewingReq(false);
    }
  };

  // Open Edit Mode for an Unlocked / Draft MOM
  const handleOpenEditMOM = (mom: MOM) => {
    setFormIsEditing(true);
    setEditingMomId(mom.id);
    setFormMeetingId(mom.meetingId);
    setFormDeptId(mom.departmentId);
    setFormTitle(mom.title);
    setFormDate(mom.meetingDate);
    setFormStartTime(mom.startTime);
    setFormEndTime(mom.endTime);
    setFormType(mom.meetingType);
    setFormLocation(mom.location);
    setFormAgenda(mom.agenda);
    setFormObjectives(mom.objectives);
    setFormDiscussionPoints(mom.discussionPoints);
    setFormDecisions(mom.decisionsMade.map((d) => d.decision));
    setFormActionItems(
      mom.actionItems.map((ai) => ({
        description: ai.description,
        assigneeId: ai.assigneeId,
        deadline: ai.deadline,
        status: (ai.status || 'Not Started') as any,
      }))
    );
    setFormPublicationStatus(mom.publicationStatus);
    setShowCreateModal(true);
  };

  // Check if MOM is currently unlocked for editing
  const isMomUnlocked = (mom: MOM) => {
    if (mom.publicationStatus === 'Draft') return true;
    if (mom.unlockedUntil && new Date(mom.unlockedUntil) > new Date()) return true;
    if (permissions.isDeveloper || permissions.isPresident) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <ClipboardCheck className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Integrated Meeting & Governance Hub</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">MoM & Attendance</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Department syncs, member-card attendance capture, locked 2-key MoM governance, and action-item tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canCreateMOM && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              <span>Draft New MoM</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-[#E3EBE7] bg-white rounded-2xl px-3 pt-2 shadow-sm gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('moms')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === 'moms'
              ? 'border-[#2FC3A5] text-[#0D5143]'
              : 'border-transparent text-[#82918B] hover:text-[#263832]'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Official MoM Records</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-[#2FC3A5] text-[#0D5143]'
              : 'border-transparent text-[#82918B] hover:text-[#263832]'
          }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          <span>HR Attendance Interface</span>
          <span className="rounded-full bg-[#E7F3D7] px-2 py-0.5 text-[10px] text-[#0D5143] font-bold">
            Interactive
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-[#2FC3A5] text-[#0D5143]'
              : 'border-transparent text-[#82918B] hover:text-[#263832]'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Attendance Reports & Analytics</span>
        </button>

        {(permissions.isDeptHead || permissions.isPresident || permissions.isHRHead) && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === 'approvals'
                ? 'border-[#2FC3A5] text-[#0D5143]'
                : 'border-transparent text-[#82918B] hover:text-[#263832]'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>2-Key Edit Approvals</span>
            {editRequests.filter((r) => r.status === 'Pending').length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800 font-bold">
                {editRequests.filter((r) => r.status === 'Pending').length} Pending
              </span>
            )}
          </button>
        )}
      </div>

      {/* ==================== TAB 1: MOM RECORDS ==================== */}
      {activeTab === 'moms' && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#82918B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search MoMs by keyword, agenda, title..."
                className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] pl-9 pr-4 py-2 text-xs text-[#263832] placeholder-[#82918B] focus:outline-none focus:border-[#2FC3A5]"
              />
            </div>

            <div>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
              >
                <option value="ALL">All Departments</option>
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
                <option value="ALL">All Publication Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Pending Review">Pending Review</option>
              </select>
            </div>
          </div>

          {/* MoM Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMOMs.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-[#E3EBE7] bg-white p-12 text-center text-[#82918B] shadow-sm">
                <FileText className="mx-auto h-8 w-8 text-[#82918B] mb-2" />
                No Minutes of Meeting match the current filter criteria.
              </div>
            ) : (
              filteredMOMs.map((mom) => {
                const dept = departments.find((d) => d.id === mom.departmentId);
                const isPublished = mom.publicationStatus === 'Published';
                const isUnlocked = isMomUnlocked(mom);
                const hasChangedAfterPublish = mom.isEditedAfterPublishing;

                return (
                  <div
                    key={mom.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#E3EBE7] bg-white p-5 shadow-sm hover:border-[#2FC3A5] transition hover:shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[#E7F3D7] px-2.5 py-0.5 text-[10px] font-bold text-[#0D5143]">
                          {dept?.name || 'Society Hub'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {hasChangedAfterPublish && (
                            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              Changed After Publishing
                            </span>
                          )}

                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1 ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-[#DDF7EF] text-[#0D5143] border border-[#2FC3A5]/40'
                            }`}
                          >
                            {isPublished ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                            <span>{mom.publicationStatus}</span>
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-[#263832] line-clamp-2">{mom.title}</h3>

                      <div className="space-y-1 text-xs text-[#637d74]">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-[#2FC3A5]" />
                          <span>{mom.meetingDate} • {mom.startTime} - {mom.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-[#2FC3A5]" />
                          <span>{mom.attendeeIds?.length || 0} Attendees Recorded</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#82918B] line-clamp-2 bg-[#F7F9F7] p-2 rounded-xl">
                        {mom.agenda || 'No formal agenda recorded'}
                      </p>

                      <div className="flex items-center gap-2 text-xs font-semibold text-[#0D5143]">
                        <CheckCircle className="h-3.5 w-3.5 text-[#2FC3A5]" />
                        <span>{mom.actionItems?.length || 0} Action Items Linked</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E3EBE7] flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedMOM(mom)}
                        className="flex-1 rounded-xl bg-[#F7F9F7] hover:bg-[#DDF7EF] py-2 text-xs font-bold text-[#0D5143] transition text-center"
                      >
                        View Split-Screen MoM
                      </button>

                      {isPublished && !isUnlocked && permissions.canRequestMOMEdit && (
                        <button
                          onClick={() => {
                            setSelectedMOM(mom);
                            setShowEditRequestModal(true);
                          }}
                          className="rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800 transition"
                          title="Submit a 2-Key edit request to Department Head"
                        >
                          Request Edit
                        </button>
                      )}

                      {isUnlocked && (permissions.canCreateMOM || permissions.canPublishMOM) && (
                        <button
                          onClick={() => handleOpenEditMOM(mom)}
                          className="rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-3 py-2 text-xs font-bold text-white transition flex items-center gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: HR ATTENDANCE INTERFACE ==================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Meeting Selection & Instructions Bar */}
          <div className="rounded-2xl border border-[#E3EBE7] bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-[#263832]">Member-Card Attendance Interface</h3>
                <p className="text-xs text-[#637d74] mt-0.5">
                  Default status is <strong>Present</strong>. Tap any card: 1st tap &rarr; <strong>Absent</strong>, 2nd tap &rarr; <strong>Late</strong>, 3rd tap &rarr; <strong>Excused</strong>.
                </p>
              </div>

              {/* Live Attendance Counter */}
              <div className="flex items-center gap-2 rounded-2xl bg-[#E7F3D7] px-4 py-2 text-xs border border-[#2FC3A5]/40">
                <span className="font-bold text-[#0D5143]">Live Quorum:</span>
                <span className="font-black text-sm text-[#0D5143]">
                  {attendanceCounts.present}/{attendanceCounts.total} Present ({attendanceCounts.percent}%)
                </span>
                <span className="text-[10px] text-[#637d74]">
                  • {attendanceCounts.absent} Absent • {attendanceCounts.late} Late
                </span>
              </div>
            </div>

            {/* Select Meeting & Capture Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E3EBE7]">
              <div>
                <label className="block text-[11px] font-bold text-[#263832] mb-1">Target Meeting Record:</label>
                <select
                  value={attendanceMeetingId}
                  onChange={(e) => setAttendanceMeetingId(e.target.value)}
                  className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                >
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.date} • {m.startTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#263832] mb-1">Recording Source:</label>
                <select
                  value={attendanceSource}
                  onChange={(e) => setAttendanceSource(e.target.value as any)}
                  className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                >
                  <option value="manual">Manual Entry (HR Verified)</option>
                  <option value="platform">Google Meet / Platform Import</option>
                  <option value="csv">Approved CSV Import</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance || departmentMembers.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] py-2 px-4 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSavingAttendance ? 'Saving Attendance...' : 'Save & Audit Attendance'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Member Attendance Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#637d74] px-1">
              <span>Department Roster: <strong>{departmentMembers.length} Members</strong></span>
              <span className="text-[11px]">Click any card to cycle attendance</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {departmentMembers.map((member) => {
                const status = attendanceMemberStates[member.id] || 'Present';
                const isPresent = status === 'Present';
                const isAbsent = status === 'Absent';
                const isLate = status === 'Late';
                const isExcused = status === 'Excused';

                return (
                  <div
                    key={member.id}
                    onClick={() => handleToggleAttendanceCard(member.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition shadow-sm select-none relative ${
                      isPresent
                        ? 'border-[#2FC3A5] bg-white hover:bg-[#DDF7EF]/40'
                        : isAbsent
                        ? 'border-rose-300 bg-rose-50/40 hover:bg-rose-50'
                        : isLate
                        ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50'
                        : 'border-blue-300 bg-blue-50/40 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={member.name}
                        className="h-10 w-10 rounded-full object-cover border border-[#E3EBE7]"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[#263832] truncate">{member.name}</h4>
                        <p className="text-[10px] text-[#82918B] truncate">{member.roleTitle}</p>
                        <p className="text-[10px] font-mono text-[#637d74] truncate">{member.memberId}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#E3EBE7]/60 flex items-center justify-between">
                      <span className="text-[10px] text-[#82918B]">Tap to cycle</span>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1 ${
                          isPresent
                            ? 'bg-[#E7F3D7] text-[#0D5143]'
                            : isAbsent
                            ? 'bg-rose-100 text-rose-800'
                            : isLate
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isPresent && <Check className="h-3 w-3 text-[#2FC3A5]" />}
                        {isAbsent && <XCircle className="h-3 w-3" />}
                        {isLate && <Clock className="h-3 w-3" />}
                        <span>{status}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: ATTENDANCE REPORTS & ANALYTICS ==================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#E3EBE7] bg-white p-5 shadow-sm">
              <div className="text-[10px] font-bold text-[#82918B] uppercase">Total Meetings Recorded</div>
              <div className="text-2xl font-black text-[#263832] mt-1">{meetings.length} Syncs</div>
              <p className="text-xs text-[#637d74] mt-1">Across all 8 operational hubs</p>
            </div>

            <div className="rounded-2xl border border-[#E3EBE7] bg-white p-5 shadow-sm">
              <div className="text-[10px] font-bold text-[#82918B] uppercase">Overall Society Quorum</div>
              <div className="text-2xl font-black text-[#0D5143] mt-1">87.4%</div>
              <p className="text-xs text-[#637d74] mt-1">Excluding approved leaves & excused absences</p>
            </div>

            <div className="rounded-2xl border border-[#E3EBE7] bg-white p-5 shadow-sm">
              <div className="text-[10px] font-bold text-[#82918B] uppercase">Extra-Hour Reviews Flagged</div>
              <div className="text-2xl font-black text-amber-700 mt-1">3 Sessions</div>
              <p className="text-xs text-[#637d74] mt-1">Recorded duration &gt; scheduled duration</p>
            </div>
          </div>

          {/* Member-Wise History Table */}
          <div className="overflow-hidden rounded-2xl border border-[#E3EBE7] bg-white shadow-sm">
            <div className="p-4 border-b border-[#E3EBE7] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#263832]">Member Attendance Ledger</h3>
                <p className="text-xs text-[#637d74]">Scheduled hours vs recorded attendance hours</p>
              </div>

              <button
                onClick={() => {
                  const headers = ['Member Name', 'Member ID', 'Department', 'Attended Meetings', 'Total Eligible', 'Attendance Rate'];
                  const rows = members.map((m) => {
                    const memAtt = attendance.filter((a) => a.memberId === m.id);
                    const attended = memAtt.filter((a) => a.status === 'Present' || a.status === 'Late').length;
                    const total = memAtt.length || 1;
                    const rate = Math.round((attended / total) * 100);
                    return [`"${m.name}"`, `"${m.memberId}"`, `"${m.primaryDepartmentId}"`, attended, total, `"${rate}%"`];
                  });
                  const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `enactus_attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-2 rounded-xl border border-[#E3EBE7] bg-white px-3 py-1.5 text-xs font-semibold text-[#263832] hover:bg-[#DDF7EF] hover:border-[#2FC3A5] transition"
              >
                <Download className="h-4 w-4 text-[#2FC3A5]" />
                <span>Export Report (.csv)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#E3EBE7] bg-[#F7F9F7] text-[#263832] font-bold">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Attended Meetings</th>
                    <th className="py-3 px-4">Scheduled Hours</th>
                    <th className="py-3 px-4">Recorded Hours</th>
                    <th className="py-3 px-4">Attendance %</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EBE7]">
                  {members.map((m) => {
                    const memAtt = attendance.filter((a) => a.memberId === m.id);
                    const attended = memAtt.filter((a) => a.status === 'Present' || a.status === 'Late').length;
                    const totalEligible = memAtt.length || 2;
                    const rate = Math.round((attended / totalEligible) * 100);
                    const scheduledHours = totalEligible * 1.5;
                    const recordedHours = attended * 1.5;

                    return (
                      <tr key={m.id} className="hover:bg-[#F7F9F7]/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#263832]">{m.name}</div>
                          <div className="text-[10px] font-mono text-[#82918B]">{m.memberId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-[#E7F3D7] px-2 py-0.5 text-[10px] font-bold text-[#0D5143]">
                            {departments.find((d) => d.id === m.primaryDepartmentId)?.name || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#263832]">
                          {attended} / {totalEligible}
                        </td>
                        <td className="py-3 px-4 text-[#637d74]">{scheduledHours} hrs</td>
                        <td className="py-3 px-4 text-[#637d74] font-semibold">{recordedHours} hrs</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-[#E3EBE7] overflow-hidden">
                              <div
                                className="h-full bg-[#2FC3A5]"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="font-bold text-[#263832]">{rate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              rate >= 75
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {rate >= 75 ? 'Compliant' : 'Short Attendance'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: 2-KEY EDIT APPROVALS (HOD/Admin) ==================== */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <h3 className="font-bold text-sm text-amber-900">2-Key Governance Protocol</h3>
            <p className="text-xs text-amber-800 mt-1">
              Published MoMs are locked official records. When HR requests an edit, the Department Head must inspect the reason and approve. An approval grants a <strong>24-hour editing window</strong>, and permanently attaches a <strong>Changed After Publishing</strong> badge to the official record.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E3EBE7] bg-white shadow-sm">
            <div className="p-4 border-b border-[#E3EBE7] font-bold text-sm text-[#263832]">
              Pending & Historical Edit Requests
            </div>

            <div className="divide-y divide-[#E3EBE7]">
              {editRequests.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#82918B]">
                  No edit requests have been logged yet.
                </div>
              ) : (
                editRequests.map((req) => {
                  const targetMom = moms.find((m) => m.id === req.momId);
                  const isPending = req.status === 'Pending';

                  return (
                    <div key={req.id} className="p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-[#82918B] block">Request ID: {req.id}</span>
                          <h4 className="font-bold text-sm text-[#263832]">
                            MOM: {targetMom?.title || req.momId}
                          </h4>
                          <p className="text-xs text-[#637d74]">
                            Requested by <strong>{req.requestedByName}</strong> on {new Date(req.requestedAt).toLocaleString()}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            req.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : req.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-xs space-y-1">
                        <div>
                          <strong className="text-[#263832]">Mandatory Justification:</strong>{' '}
                          <span className="text-[#637d74]">{req.reason}</span>
                        </div>
                        {req.proposedChanges && (
                          <div>
                            <strong className="text-[#263832]">Proposed Alterations:</strong>{' '}
                            <span className="text-[#637d74]">{req.proposedChanges}</span>
                          </div>
                        )}
                      </div>

                      {/* HOD Review Controls */}
                      {isPending && (permissions.isDeptHead || permissions.isPresident) && (
                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                          <input
                            type="text"
                            placeholder="Optional reviewer notes / comments..."
                            value={reviewerComment}
                            onChange={(e) => setReviewerComment(e.target.value)}
                            className="flex-1 rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                          />
                          <button
                            onClick={() => handleReviewEditRequest(req.id, 'Approved')}
                            disabled={isReviewingReq}
                            className="rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-4 py-1.5 text-xs font-bold text-white transition shadow-sm"
                          >
                            Approve (24h Unlock)
                          </button>
                          <button
                            onClick={() => handleReviewEditRequest(req.id, 'Rejected')}
                            disabled={isReviewingReq}
                            className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-1.5 text-xs font-bold text-rose-700 transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SPLIT-SCREEN MOM DETAIL MODAL ==================== */}
      {selectedMOM && !showEditRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E3EBE7] bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E3EBE7] px-6 py-4 bg-white">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#2FC3A5]" />
                <div>
                  <h3 className="font-bold text-base text-[#263832]">{selectedMOM.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#637d74]">
                    <span>{selectedMOM.meetingDate}</span>
                    <span>•</span>
                    <span>{selectedMOM.startTime} - {selectedMOM.endTime}</span>
                    {selectedMOM.isEditedAfterPublishing && (
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.2 text-[10px] font-bold text-amber-800">
                        Changed After Publishing
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedMOM.publicationStatus === 'Published' && !isMomUnlocked(selectedMOM) && permissions.canRequestMOMEdit && (
                  <button
                    onClick={() => setShowEditRequestModal(true)}
                    className="rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 transition"
                  >
                    Request Edit
                  </button>
                )}

                {isMomUnlocked(selectedMOM) && (
                  <button
                    onClick={() => {
                      const m = selectedMOM;
                      setSelectedMOM(null);
                      handleOpenEditMOM(m);
                    }}
                    className="rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-3 py-1.5 text-xs font-bold text-white transition flex items-center gap-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit MoM</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedMOM(null)}
                  className="rounded-full p-1.5 text-[#82918B] hover:bg-[#F7F9F7] transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Split Screen Body */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E3EBE7]">
              {/* Left Panel: Meeting Details, Agenda, Decisions (7/12 cols) */}
              <div className="md:col-span-7 p-6 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                    <div className="text-[10px] font-bold text-[#82918B] uppercase">Department</div>
                    <div className="font-bold text-[#263832] mt-0.5">
                      {departments.find((d) => d.id === selectedMOM.departmentId)?.name || 'General Operations'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                    <div className="text-[10px] font-bold text-[#82918B] uppercase">Platform / Venue</div>
                    <div className="font-bold text-[#263832] mt-0.5">{selectedMOM.location || 'Google Meet'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#263832] uppercase tracking-wider mb-1">Agenda & Purpose</h4>
                  <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-xs text-[#263832] whitespace-pre-wrap">
                    {selectedMOM.agenda || 'No formal agenda recorded'}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#263832] uppercase tracking-wider mb-2">Decisions Made</h4>
                  {selectedMOM.decisionsMade?.length === 0 ? (
                    <p className="text-xs text-[#82918B]">No decisions recorded.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {selectedMOM.decisionsMade.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#263832]">
                          <CheckCircle2 className="h-4 w-4 text-[#2FC3A5] shrink-0 mt-0.5" />
                          <span>{d.decision}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#263832] uppercase tracking-wider mb-2">Discussion Notes</h4>
                  {selectedMOM.discussionPoints?.map((dp, i) => (
                    <div key={i} className="rounded-xl border border-[#E3EBE7] p-3 text-xs mb-2">
                      <div className="font-bold text-[#263832]">{dp.topic}</div>
                      <div className="text-[#637d74] mt-1">{dp.notes || 'No detailed notes.'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: Action Items, Owners, Status (5/12 cols) */}
              <div className="md:col-span-5 p-6 space-y-4 bg-[#F7F9F7]/50 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#263832] uppercase tracking-wider">
                    Linked Action Items ({selectedMOM.actionItems?.length || 0})
                  </h4>
                  <span className="text-[10px] text-[#82918B]">Auto-synced to tasks</span>
                </div>

                <div className="space-y-3">
                  {selectedMOM.actionItems?.length === 0 ? (
                    <p className="text-xs text-[#82918B]">No action items logged for this meeting.</p>
                  ) : (
                    selectedMOM.actionItems.map((ai, idx) => {
                      const assignee = members.find((m) => m.id === ai.assigneeId);
                      const st = ai.status || 'Not Started';

                      return (
                        <div key={idx} className="rounded-2xl border border-[#E3EBE7] bg-white p-3.5 shadow-sm space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-[#263832] line-clamp-2">
                              {ai.description}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                                st === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : st === 'In Progress'
                                  ? 'bg-blue-50 text-blue-700'
                                  : st === 'Blocked'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-zinc-100 text-zinc-700'
                              }`}
                            >
                              {st}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#637d74] pt-2 border-t border-[#E3EBE7]/60">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-[#2FC3A5]" />
                              <span>{assignee ? assignee.name : 'Unassigned'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <Clock className="h-3 w-3 text-[#82918B]" />
                              <span>Due {ai.deadline}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2-KEY EDIT REQUEST MODAL ==================== */}
      {showEditRequestModal && selectedMOM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3EBE7] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-base text-[#263832]">Request Edit Permission</h3>
              </div>
              <button
                onClick={() => setShowEditRequestModal(false)}
                className="rounded-full p-1 text-[#82918B] hover:bg-[#F7F9F7] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#637d74]">
              You are requesting to edit published minutes: <strong>"{selectedMOM.title}"</strong>. This requires formal approval from the Department Head.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#263832] mb-1">
                  Mandatory Reason for Edit <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={editRequestReason}
                  onChange={(e) => setEditRequestReason(e.target.value)}
                  placeholder="Explain why this published document requires modification..."
                  className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#263832] mb-1">
                  Proposed Alterations / Corrections:
                </label>
                <textarea
                  rows={2}
                  value={editRequestChanges}
                  onChange={(e) => setEditRequestChanges(e.target.value)}
                  placeholder="Detail the exact items or decisions being corrected..."
                  className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E3EBE7]">
              <button
                onClick={() => setShowEditRequestModal(false)}
                className="rounded-xl border border-[#E3EBE7] bg-white px-4 py-2 text-xs font-bold text-[#263832] hover:bg-[#F7F9F7] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEditRequest}
                disabled={isSubmittingEditReq}
                className="rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-4 py-2 text-xs font-bold text-white transition shadow-sm"
              >
                {isSubmittingEditReq ? 'Submitting...' : 'Submit to HOD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREATE / EDIT MOM MODAL ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E3EBE7] bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E3EBE7] px-6 py-4 bg-white">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#2FC3A5]" />
                <h3 className="font-bold text-base text-[#263832]">
                  {formIsEditing ? 'Edit Minutes of Meeting' : 'Draft New Minutes of Meeting (3-Min Entry)'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1.5 text-[#82918B] hover:bg-[#F7F9F7] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMOMSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Pre-fill from existing meeting */}
              {!formIsEditing && (
                <div className="rounded-2xl border border-[#2FC3A5]/40 bg-[#DDF7EF]/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0D5143] flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-[#2FC3A5]" />
                      Smart Pre-fill from Scheduled Meeting:
                    </span>
                    <button
                      type="button"
                      onClick={handleCarryForwardTasks}
                      className="rounded-xl bg-white border border-[#2FC3A5] px-2.5 py-1 text-[11px] font-bold text-[#0D5143] hover:bg-[#E7F3D7] transition shadow-xs"
                    >
                      Carry Over Unfinished Tasks
                    </button>
                  </div>

                  <select
                    value={formMeetingId}
                    onChange={(e) => handleSelectPreFillMeeting(e.target.value)}
                    className="w-full rounded-xl border border-[#E3EBE7] bg-white px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  >
                    <option value="">Select a scheduled meeting to pre-fill details & agenda...</option>
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.date} • {m.startTime})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Core Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-[#263832] mb-1">Meeting Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Digital Operations Sprint Sync"
                    className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#263832] mb-1">Department *</label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#263832] mb-1">Meeting Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#263832] mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#263832] mb-1">End Time</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#263832] mb-1">Platform / Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Google Meet"
                    className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832]"
                  />
                </div>
              </div>

              {/* Agenda */}
              <div>
                <label className="block text-xs font-bold text-[#263832] mb-1">Meeting Agenda & Topics</label>
                <textarea
                  rows={3}
                  value={formAgenda}
                  onChange={(e) => setFormAgenda(e.target.value)}
                  placeholder="1. Weekly sprint deliverable check&#10;2. Marketing collateral status"
                  className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              {/* Decisions Made (Bullets) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#263832]">Decisions Made (Ratified Bullets)</label>
                  <button
                    type="button"
                    onClick={() => setFormDecisions((prev) => [...prev, ''])}
                    className="text-xs font-bold text-[#2FC3A5] hover:underline"
                  >
                    + Add Decision
                  </button>
                </div>
                <div className="space-y-2">
                  {formDecisions.map((dec, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={dec}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormDecisions((prev) => prev.map((item, idx) => (idx === i ? val : item)));
                        }}
                        placeholder={`Decision #${i + 1}`}
                        className="flex-1 rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                      />
                      {formDecisions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormDecisions((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#263832]">
                    Action Items (Assigned Owners & Deadlines)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormActionItems((prev) => [
                        ...prev,
                        {
                          description: '',
                          assigneeId: members[0]?.id || '',
                          deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                          status: 'Not Started',
                        },
                      ])
                    }
                    className="text-xs font-bold text-[#2FC3A5] hover:underline"
                  >
                    + Add Action Item
                  </button>
                </div>
                <div className="space-y-2">
                  {formActionItems.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center bg-[#F7F9F7] p-2.5 rounded-xl border border-[#E3EBE7]">
                      <input
                        type="text"
                        placeholder="Action item task description..."
                        value={item.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormActionItems((prev) =>
                            prev.map((it, idx) => (idx === i ? { ...it, description: val } : it))
                          );
                        }}
                        className="col-span-5 rounded-lg border border-[#E3EBE7] bg-white px-2.5 py-1.5 text-xs text-[#263832]"
                      />

                      <select
                        value={item.assigneeId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormActionItems((prev) =>
                            prev.map((it, idx) => (idx === i ? { ...it, assigneeId: val } : it))
                          );
                        }}
                        className="col-span-3 rounded-lg border border-[#E3EBE7] bg-white px-2 py-1.5 text-xs text-[#263832]"
                      >
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>

                      <input
                        type="date"
                        value={item.deadline}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormActionItems((prev) =>
                            prev.map((it, idx) => (idx === i ? { ...it, deadline: val } : it))
                          );
                        }}
                        className="col-span-3 rounded-lg border border-[#E3EBE7] bg-white px-2 py-1.5 text-xs text-[#263832]"
                      />

                      <button
                        type="button"
                        onClick={() => setFormActionItems((prev) => prev.filter((_, idx) => idx !== i))}
                        className="col-span-1 text-center text-rose-500 hover:text-rose-700"
                      >
                        <X className="h-4 w-4 mx-auto" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Publication Status Selector */}
              <div className="pt-2 border-t border-[#E3EBE7] flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-[#263832] block">Publication Lifecycle:</label>
                  <p className="text-[10px] text-[#82918B]">
                    Drafts remain editable by HR. Published records lock and become official.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={formPublicationStatus}
                    onChange={(e) => setFormPublicationStatus(e.target.value as any)}
                    className="rounded-xl border border-[#E3EBE7] bg-white px-3 py-1.5 text-xs text-[#263832] font-semibold"
                  >
                    <option value="Draft">Draft (Editable)</option>
                    <option value="Published">Published (Locked Official Record)</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isSubmittingMOM}
                    className="rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-5 py-2 text-xs font-bold text-white transition shadow-sm"
                  >
                    {isSubmittingMOM ? 'Saving...' : formIsEditing ? 'Update MoM' : 'Save MoM'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
