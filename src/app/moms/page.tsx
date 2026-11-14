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

interface FormMemberAttendance {
  status: 'Present' | 'Late' | 'Absent';
  minutesAttended: number | '';
}

const calculateMinutesDiff = (start: string, end: string): number => {
  if (!start || !end) return 60;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 60;
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? diff : 60;
};
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
  const [formDuration, setFormDuration] = useState<number>(90);
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

  // Integrated Member Attendance State for Create/Edit MoM
  const [formMemberAttendance, setFormMemberAttendance] = useState<Record<string, FormMemberAttendance>>({});
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');

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

  // Duration change handler: auto-updates Present members and adjusts Late members if needed
  const handleDurationChange = (newDuration: number) => {
    const validDuration = Math.max(1, newDuration);
    setFormDuration(validDuration);
    setFormMemberAttendance((prev) => {
      const updated: Record<string, FormMemberAttendance> = { ...prev };
      for (const mId of Object.keys(updated)) {
        const item = updated[mId];
        if (item.status === 'Present') {
          updated[mId] = {
            status: 'Present',
            minutesAttended: validDuration,
          };
        } else if (item.status === 'Absent') {
          updated[mId] = {
            status: 'Absent',
            minutesAttended: 0,
          };
        } else if (item.status === 'Late') {
          const currentMins = typeof item.minutesAttended === 'number' ? item.minutesAttended : 0;
          if (currentMins > validDuration) {
            updated[mId] = {
              status: 'Late',
              minutesAttended: validDuration,
            };
          }
        }
      }
      return updated;
    });
  };

  // Start & End time changes calculate duration automatically
  const handleStartTimeChange = (newStart: string) => {
    setFormStartTime(newStart);
    if (newStart && formEndTime) {
      const diff = calculateMinutesDiff(newStart, formEndTime);
      handleDurationChange(diff);
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setFormEndTime(newEnd);
    if (formStartTime && newEnd) {
      const diff = calculateMinutesDiff(formStartTime, newEnd);
      handleDurationChange(diff);
    }
  };

  // Status selection logic:
  // - Present: assigns full meeting duration
  // - Late: manual numeric input (0 to meeting duration)
  // - Absent: assigns 0 minutes
  // - Switch from Late to Present: replaces manual value with full duration
  const handleMemberStatusChange = (memberId: string, newStatus: 'Present' | 'Late' | 'Absent') => {
    setFormMemberAttendance((prev) => {
      const current = prev[memberId];
      if (newStatus === 'Present') {
        return {
          ...prev,
          [memberId]: { status: 'Present', minutesAttended: formDuration },
        };
      } else if (newStatus === 'Absent') {
        return {
          ...prev,
          [memberId]: { status: 'Absent', minutesAttended: 0 },
        };
      } else {
        return {
          ...prev,
          [memberId]: {
            status: 'Late',
            minutesAttended:
              current?.status === 'Late' && typeof current.minutesAttended === 'number'
                ? Math.min(current.minutesAttended, formDuration)
                : '',
          },
        };
      }
    });
  };

  const handleLateMinutesChange = (memberId: string, val: string) => {
    if (val === '') {
      setFormMemberAttendance((prev) => ({
        ...prev,
        [memberId]: { status: 'Late', minutesAttended: '' },
      }));
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const clamped = Math.max(0, Math.min(num, formDuration));
    setFormMemberAttendance((prev) => ({
      ...prev,
      [memberId]: { status: 'Late', minutesAttended: clamped },
    }));
  };

  const filteredFormMembers = useMemo(() => {
    if (!attendanceSearchTerm.trim()) return members;
    const term = attendanceSearchTerm.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.roleTitle.toLowerCase().includes(term) ||
        departments.find((d) => d.id === (m.primaryDepartmentId || m.assignedDepartmentId))?.name.toLowerCase().includes(term)
    );
  }, [members, departments, attendanceSearchTerm]);

  const formAttendanceCounts = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    members.forEach((m) => {
      const att = formMemberAttendance[m.id];
      const st = att ? att.status : 'Present';
      if (st === 'Present') present++;
      else if (st === 'Late') late++;
      else if (st === 'Absent') absent++;
    });
    return { present, late, absent, total: members.length };
  }, [members, formMemberAttendance]);

  // Attendance Records for the Selected MOM in Detail Modal
  const selectedMomCalculatedDuration = useMemo(() => {
    if (!selectedMOM) return 60;
    return calculateMinutesDiff(selectedMOM.startTime, selectedMOM.endTime);
  }, [selectedMOM]);

  const selectedMomAttendanceRecords = useMemo(() => {
    if (!selectedMOM) return [];
    return members.map((member) => {
      const rec = attendance.find(
        (a) => a.meetingId === selectedMOM.meetingId && a.memberId === member.id
      );
      if (rec) {
        const st = (rec.status === 'Present' || rec.status === 'Late' || rec.status === 'Absent')
          ? rec.status
          : 'Present';
        const mins = rec.durationMinutes !== undefined
          ? rec.durationMinutes
          : (st === 'Absent' ? 0 : selectedMomCalculatedDuration);
        return {
          member,
          status: st,
          duration: mins,
        };
      }
      const isAbsent = selectedMOM.absenteeIds?.includes(member.id);
      const isPresent = selectedMOM.attendeeIds?.includes(member.id);
      const st = isAbsent ? 'Absent' : (isPresent ? 'Present' : 'Absent');
      const mins = st === 'Absent' ? 0 : selectedMomCalculatedDuration;
      return {
        member,
        status: st,
        duration: mins,
      };
    });
  }, [selectedMOM, members, attendance, selectedMomCalculatedDuration]);

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
    setFormMeetingId(`meeting-${Date.now()}`);
    setFormTitle('');
    setFormAgenda('');
    setFormObjectives('');
    setFormDecisions(['']);
    setFormDiscussionPoints([{ topic: 'Operational Updates', notes: '' }]);
    setFormActionItems([
      { description: '', assigneeId: members[0]?.id || '', deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), status: 'Not Started' },
    ]);
    setFormPublicationStatus('Draft');
    const initialDuration = calculateMinutesDiff(formStartTime, formEndTime);
    setFormDuration(initialDuration);
    const initialAtt: Record<string, FormMemberAttendance> = {};
    members.forEach((m) => {
      initialAtt[m.id] = { status: 'Present', minutesAttended: initialDuration };
    });
    setFormMemberAttendance(initialAtt);
    setAttendanceSearchTerm('');
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
      const diff = calculateMinutesDiff(m.startTime, m.endTime);
      handleDurationChange(diff);
      setFormType(m.mode);
      setFormLocation(m.location);
      setFormAgenda(m.agenda);
      setFormObjectives(m.objectives || 'Review deliverables and assign sprint action items.');
      if (m.meetingLink) setFormMeetingLink(m.meetingLink);

      // Pre-fill existing attendance for this scheduled meeting if available
      const meetingExistingAtt = attendance.filter((a) => a.meetingId === m.id);
      if (meetingExistingAtt.length > 0) {
        setFormMemberAttendance((prev) => {
          const updated = { ...prev };
          members.forEach((mem) => {
            const rec = meetingExistingAtt.find((a) => a.memberId === mem.id);
            if (rec) {
              const st = (rec.status === 'Present' || rec.status === 'Late' || rec.status === 'Absent')
                ? rec.status
                : 'Present';
              updated[mem.id] = {
                status: st,
                minutesAttended: rec.durationMinutes !== undefined
                  ? rec.durationMinutes
                  : (st === 'Absent' ? 0 : diff),
              };
            }
          });
          return updated;
        });
      }
    }
  };

  // Submit Create or Edit MoM with Integrated Attendance Persistence
  const handleSaveMOMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (formDuration <= 0) {
      alert('Total meeting duration must be greater than 0 minutes.');
      return;
    }

    // Validate Late members have valid numeric minutes
    for (const m of members) {
      const att = formMemberAttendance[m.id];
      if (att && att.status === 'Late') {
        if (att.minutesAttended === '' || isNaN(Number(att.minutesAttended))) {
          alert(`Please enter the minutes attended (0 to ${formDuration}) for Late member: ${m.name}.`);
          return;
        }
        const mins = Number(att.minutesAttended);
        if (mins < 0 || mins > formDuration) {
          alert(`Minutes attended for ${m.name} must be between 0 and ${formDuration} minutes.`);
          return;
        }
      }
    }

    setIsSubmittingMOM(true);

    const targetMeetingId = formMeetingId || (editingMomId ? editingMomId : `meeting-${Date.now()}`);

    const attendeeIds: string[] = [];
    const absenteeIds: string[] = [];
    members.forEach((m) => {
      const att = formMemberAttendance[m.id] || { status: 'Present', minutesAttended: formDuration };
      if (att.status === 'Absent') {
        absenteeIds.push(m.id);
      } else {
        attendeeIds.push(m.id);
      }
    });

    const payload = {
      meetingId: targetMeetingId,
      departmentId: formDeptId,
      title: formTitle,
      meetingDate: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      meetingType: formType,
      location: formLocation,
      agenda: formAgenda,
      objectives: formObjectives,
      attendeeIds,
      absenteeIds,
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

    let saveSuccess = false;
    let errorMessage = '';

    if (formIsEditing && editingMomId) {
      const res = await updateMOM({
        id: editingMomId,
        ...payload,
        editorId: currentUser.id,
        editorNote: 'Content and attendance updated via MoM editor',
      });
      saveSuccess = res.success;
      errorMessage = res.error || 'Failed to update MOM';
    } else {
      const res = await addMOM(payload);
      saveSuccess = res.success;
      errorMessage = res.error || 'Failed to create MOM';
    }

    if (!saveSuccess) {
      setIsSubmittingMOM(false);
      alert(errorMessage);
      return;
    }

    // Persist Attendance Records linked to this meeting
    try {
      const attendancePayload = {
        meetingId: targetMeetingId,
        departmentId: formDeptId,
        markedById: currentUser.id,
        records: members.map((m) => {
          const att = formMemberAttendance[m.id] || { status: 'Present', minutesAttended: formDuration };
          const mins = att.status === 'Absent' ? 0 : Number(att.minutesAttended);
          return {
            memberId: m.id,
            status: att.status,
            durationMinutes: mins,
            notes: `Attended ${mins} min of ${formDuration} min meeting`,
          };
        }),
      };
      await recordAttendance(attendancePayload);
    } catch (attErr) {
      console.error('Error saving attendance records:', attErr);
    }

    setIsSubmittingMOM(false);
    setShowCreateModal(false);
    await refreshAll();
    alert(
      formIsEditing
        ? 'MOM and attendance updated successfully!'
        : `MOM and attendance saved as ${formPublicationStatus}!`
    );
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
    const diff = calculateMinutesDiff(mom.startTime, mom.endTime);
    setFormDuration(diff);
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

    // Pre-fill attendance records for this meeting
    const meetingExistingAtt = attendance.filter((a) => a.meetingId === mom.meetingId);
    const loadedAtt: Record<string, FormMemberAttendance> = {};
    members.forEach((m) => {
      const rec = meetingExistingAtt.find((a) => a.memberId === m.id);
      if (rec) {
        const st = (rec.status === 'Present' || rec.status === 'Late' || rec.status === 'Absent')
          ? rec.status
          : 'Present';
        loadedAtt[m.id] = {
          status: st,
          minutesAttended: rec.durationMinutes !== undefined
            ? rec.durationMinutes
            : (st === 'Absent' ? 0 : diff),
        };
      } else {
        const isAbsent = mom.absenteeIds?.includes(m.id);
        const st = isAbsent ? 'Absent' : 'Present';
        loadedAtt[m.id] = {
          status: st,
          minutesAttended: st === 'Absent' ? 0 : diff,
        };
      }
    });
    setFormMemberAttendance(loadedAtt);
    setAttendanceSearchTerm('');
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

      {/* ==================== OFFICIAL MOM RECORDS ==================== */}
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

                {/* Meeting Attendance & Attended Duration List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-[#263832] uppercase tracking-wider">
                      Meeting Attendance & Duration ({selectedMomAttendanceRecords.length})
                    </h4>
                    <span className="text-[10px] text-[#637d74] font-medium">
                      Total Duration: {selectedMomCalculatedDuration} min
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#E3EBE7] bg-white overflow-hidden shadow-xs divide-y divide-[#E3EBE7] max-h-72 overflow-y-auto">
                    {selectedMomAttendanceRecords.map(({ member, status, duration }) => {
                      const isPresent = status === 'Present';
                      const isLate = status === 'Late';

                      return (
                        <div key={member.id} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={member.name}
                              className="h-7 w-7 rounded-full object-cover border border-[#E3EBE7] shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-[#263832] truncate">{member.name}</div>
                              <div className="text-[10px] text-[#82918B] truncate">
                                {departments.find((d) => d.id === (member.primaryDepartmentId || member.assignedDepartmentId))?.name || 'Digital Operations'} • {member.roleTitle}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                isPresent
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isLate
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {status}
                            </span>
                            <span className="font-mono font-bold text-xs text-[#263832] min-w-[50px] text-right">
                              {duration} min
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#263832] mb-1">End Time</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#263832] mb-1">Meeting Duration (min) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formDuration}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 60"
                    className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
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

              {/* Integrated Member Attendance Marking */}
              <div className="rounded-2xl border border-[#2FC3A5]/40 bg-[#F7F9F7] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ClipboardCheck className="h-4 w-4 text-[#2FC3A5]" />
                      <h4 className="font-bold text-xs text-[#263832] uppercase tracking-wider">
                        Member Attendance & Duration Tracking
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#637d74] mt-0.5">
                      Mark member attendance. <strong>Present</strong> members automatically receive full duration ({formDuration} min). <strong>Late</strong> members require manual minutes entry (0–{formDuration} min).
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] shrink-0 font-bold">
                    <span className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-1">
                      {formAttendanceCounts.present} Present
                    </span>
                    <span className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1">
                      {formAttendanceCounts.late} Late
                    </span>
                    <span className="rounded-lg bg-rose-50 border border-rose-200 text-rose-800 px-2 py-1">
                      {formAttendanceCounts.absent} Absent
                    </span>
                  </div>
                </div>

                {/* Member Search / Filter Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#82918B]" />
                  <input
                    type="text"
                    value={attendanceSearchTerm}
                    onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                    placeholder="Search member by name or department..."
                    className="w-full rounded-xl border border-[#E3EBE7] bg-white pl-8 pr-3 py-1.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>

                {/* Member Attendance Roster List */}
                <div className="max-h-64 overflow-y-auto space-y-2 rounded-xl border border-[#E3EBE7] bg-white p-2">
                  {filteredFormMembers.map((member) => {
                    const att = formMemberAttendance[member.id] || { status: 'Present', minutesAttended: formDuration };
                    const isPresent = att.status === 'Present';
                    const isLate = att.status === 'Late';
                    const isAbsent = att.status === 'Absent';

                    return (
                      <div
                        key={member.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl border transition ${
                          isPresent
                            ? 'border-[#2FC3A5]/40 bg-[#DDF7EF]/20'
                            : isLate
                            ? 'border-amber-200 bg-amber-50/30'
                            : 'border-rose-200 bg-rose-50/20'
                        }`}
                      >
                        {/* Member Info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={member.name}
                            className="h-8 w-8 rounded-full object-cover border border-[#E3EBE7] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#263832] truncate">{member.name}</div>
                            <div className="text-[10px] text-[#82918B] truncate">
                              {departments.find((d) => d.id === (member.primaryDepartmentId || member.assignedDepartmentId))?.name || 'Digital Operations'} • {member.roleTitle}
                            </div>
                          </div>
                        </div>

                        {/* Status Selection & Minutes Attended */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Status Selector Pills */}
                          <div className="flex items-center rounded-lg bg-[#F7F9F7] p-0.5 border border-[#E3EBE7] text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => handleMemberStatusChange(member.id, 'Present')}
                              className={`px-2.5 py-1 rounded-md transition ${
                                isPresent
                                  ? 'bg-[#2FC3A5] text-white shadow-xs'
                                  : 'text-[#637d74] hover:text-[#263832]'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMemberStatusChange(member.id, 'Late')}
                              className={`px-2.5 py-1 rounded-md transition ${
                                isLate
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-[#637d74] hover:text-[#263832]'
                              }`}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMemberStatusChange(member.id, 'Absent')}
                              className={`px-2.5 py-1 rounded-md transition ${
                                isAbsent
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : 'text-[#637d74] hover:text-[#263832]'
                              }`}
                            >
                              Absent
                            </button>
                          </div>

                          {/* Minutes Attended Display / Input */}
                          <div className="min-w-[110px] flex items-center justify-end">
                            {isPresent && (
                              <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                {formDuration} min
                              </span>
                            )}

                            {isLate && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={formDuration}
                                  value={att.minutesAttended}
                                  onChange={(e) => handleLateMinutesChange(member.id, e.target.value)}
                                  placeholder="Minutes"
                                  className="w-16 rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs text-[#263832] font-mono text-center focus:outline-none focus:border-amber-500"
                                />
                                <span className="text-[10px] font-bold text-amber-800">
                                  / {formDuration}m
                                </span>
                              </div>
                            )}

                            {isAbsent && (
                              <span className="font-mono font-bold text-xs text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                                0 min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
