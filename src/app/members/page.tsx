'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { MemberDetailModal } from '@/components/members/MemberDetailModal';
import { Member, RoleType } from '@/types';
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  UserPlus,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  ArrowUpDown,
  Lock,
  CheckSquare,
  Square,
  Clock,
  Sparkles,
  Settings2,
} from 'lucide-react';

export default function MembersPage() {
  const { currentUser, permissions } = useAuth();
  const { departments, members, settings, addMember, refreshAll } = useData();

  // Active view tab: 'active' | 'pending' | 'inactive'
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'inactive'>('active');

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'yearOfJoining' | 'department'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Row selection for selective export
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [exportScope, setExportScope] = useState<'selected' | 'filtered'>('selected');
  const [exportColumns, setExportColumns] = useState<Record<string, boolean>>({
    memberId: true,
    name: true,
    roleTitle: true,
    role: true,
    department: true,
    branch: true,
    semester: true,
    yearOfJoining: true,
    membershipStatus: true,
    email: true,
    enrollment: true,
    jeeRank: true,
  });

  // Action Modals (Suspend, Reactivate, Terminate, Reject)
  const [actionModal, setActionModal] = useState<{
    type: 'SUSPEND' | 'REACTIVATE' | 'TERMINATE' | 'REJECT' | null;
    member: Member | null;
  }>({ type: null, member: null });
  const [actionReason, setActionReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionError, setActionError] = useState('');

  // Modals for Onboarding
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [csvStatusMessage, setCsvStatusMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // New Member Form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberEnroll, setNewMemberEnroll] = useState('');
  const [newMemberJee, setNewMemberJee] = useState('');
  const [newMemberDept, setNewMemberDept] = useState(departments[0]?.id || 'digital-operations');
  const [newMemberRole, setNewMemberRole] = useState<RoleType>('general_member');
  const [newMemberRoleTitle, setNewMemberRoleTitle] = useState('Member');
  const [newMemberBranch, setNewMemberBranch] = useState('Computer Science & Engineering');
  const [newMemberSem, setNewMemberSem] = useState(3);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Privacy authorization check
  const isAuthorizedSensitive = permissions.canViewSensitiveMemberData;
  const isHRAdmin = permissions.isPresident || permissions.isHRHead || permissions.isSecretary;

  // Split members into categories
  const pendingMembers = useMemo(() => {
    return members.filter((m) => m.approvalStatus === 'PENDING');
  }, [members]);

  const activeMembers = useMemo(() => {
    return members.filter(
      (m) =>
        (m.approvalStatus === 'APPROVED' || !m.approvalStatus) &&
        m.membershipStatus !== 'SUSPENDED' &&
        m.membershipStatus !== 'TERMINATED'
    );
  }, [members]);

  const inactiveMembers = useMemo(() => {
    return members.filter(
      (m) =>
        m.approvalStatus === 'REJECTED' ||
        m.membershipStatus === 'SUSPENDED' ||
        m.membershipStatus === 'TERMINATED'
    );
  }, [members]);

  // Current tab list
  const currentList = useMemo(() => {
    if (activeTab === 'pending') return pendingMembers;
    if (activeTab === 'inactive') return inactiveMembers;
    return activeMembers;
  }, [activeTab, pendingMembers, inactiveMembers, activeMembers]);

  // Filter & Sort
  const filteredMembers = useMemo(() => {
    let list = currentList.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (isAuthorizedSensitive && m.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept = filterDept === 'ALL' || m.primaryDepartmentId === filterDept;
      const matchesRole = filterRole === 'ALL' || m.role === filterRole;
      const matchesSemester = filterSemester === 'ALL' || m.currentSemester === Number(filterSemester);

      return matchesSearch && matchesDept && matchesRole && matchesSemester;
    });

    list.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'name') comp = a.name.localeCompare(b.name);
      else if (sortBy === 'yearOfJoining') comp = a.yearOfJoining - b.yearOfJoining;
      else if (sortBy === 'department') comp = a.primaryDepartmentId.localeCompare(b.primaryDepartmentId);
      return sortOrder === 'asc' ? comp : -comp;
    });

    return list;
  }, [currentList, searchQuery, filterDept, filterRole, filterSemester, sortBy, sortOrder, isAuthorizedSensitive]);

  // Row selection toggling
  const handleToggleSelectAll = () => {
    if (selectedRowIds.length === filteredMembers.length && filteredMembers.length > 0) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredMembers.map((m) => m.id));
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Perform HR Lifecycle actions (Approve, Reject, Suspend, Reactivate, Terminate)
  const handleLifecycleAction = async (action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REACTIVATE' | 'TERMINATE', member: Member) => {
    if (!currentUser) return;
    setIsProcessingAction(true);
    setActionError('');

    try {
      const res = await fetch('/api/auth/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          memberId: member.id,
          adminId: currentUser.id,
          reason: actionReason || `${action} by ${currentUser.name}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to process request');
        return;
      }

      await refreshAll();
      setActionModal({ type: null, member: null });
      setActionReason('');
    } catch (err: any) {
      setActionError(err.message || 'Network error occurred');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Generate Excel Spreadsheet XML or CSV
  const handleRunExport = () => {
    const targetMembers =
      exportScope === 'selected' && selectedRowIds.length > 0
        ? filteredMembers.filter((m) => selectedRowIds.includes(m.id))
        : filteredMembers;

    if (targetMembers.length === 0) {
      alert('No members selected or available to export.');
      return;
    }

    const availableCols: { key: string; label: string; sensitive?: boolean; getValue: (m: Member) => string }[] = [
      { key: 'memberId', label: 'Member ID', getValue: (m) => m.memberId },
      { key: 'name', label: 'Full Name', getValue: (m) => m.name },
      { key: 'roleTitle', label: 'Designation / Title', getValue: (m) => m.roleTitle },
      { key: 'role', label: 'System Role', getValue: (m) => m.role },
      {
        key: 'department',
        label: 'Department',
        getValue: (m) => departments.find((d) => d.id === m.primaryDepartmentId)?.name || m.primaryDepartmentId,
      },
      { key: 'branch', label: 'Branch', getValue: (m) => m.branch },
      { key: 'semester', label: 'Semester', getValue: (m) => String(m.currentSemester) },
      { key: 'yearOfJoining', label: 'Joining Year', getValue: (m) => String(m.yearOfJoining) },
      { key: 'membershipStatus', label: 'Membership Status', getValue: (m) => m.membershipStatus || m.status },
      { key: 'email', label: 'Email', sensitive: true, getValue: (m) => m.email },
      { key: 'enrollment', label: 'College Enrollment', sensitive: true, getValue: (m) => m.collegeEnrollment || 'N/A' },
      { key: 'jeeRank', label: 'JEE Rank', sensitive: true, getValue: (m) => m.jeeRank ? String(m.jeeRank) : 'N/A' },
    ];

    const activeCols = availableCols.filter((col) => {
      if (col.sensitive && !isAuthorizedSensitive) return false;
      return exportColumns[col.key] !== false;
    });

    const timestamp = new Date().toISOString().slice(0, 10);

    if (exportFormat === 'csv') {
      // RFC-4180 standard CSV with UTF-8 BOM
      const headerRow = activeCols.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
      const rows = targetMembers.map((m) =>
        activeCols.map((c) => `"${c.getValue(m).replace(/"/g, '""')}"`).join(',')
      );
      const csvString = '\uFEFF' + [headerRow, ...rows].join('\r\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Enactus_Members_${activeTab}_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Genuine Excel 2003 XML Workbook (.xlsx / .xml)
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2FC3A5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Data">
   <Alignment ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Enactus_Members">
  <Table ss:DefaultRowHeight="20">
`;
      // Header row
      xml += '   <Row ss:Height="24">\n';
      activeCols.forEach((col) => {
        xml += `    <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>\n`;
      });
      xml += '   </Row>\n';

      // Data rows
      targetMembers.forEach((m) => {
        xml += '   <Row>\n';
        activeCols.forEach((col) => {
          xml += `    <Cell ss:StyleID="Data"><Data ss:Type="String">${escapeXml(col.getValue(m))}</Data></Cell>\n`;
        });
        xml += '   </Row>\n';
      });

      xml += `  </Table>
 </Worksheet>
</Workbook>`;

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Enactus_Members_${activeTab}_${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setShowExportModal(false);
  };

  function escapeXml(unsafe: string) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  // Import CSV handler
  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvInput.trim()) return;
    setIsImporting(true);
    setCsvStatusMessage('');

    try {
      const res = await fetch('/api/members/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: csvInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setCsvStatusMessage(`Successfully imported ${data.importedCount} members! Skipped ${data.skippedCount} duplicates.`);
        setTimeout(async () => {
          setShowCsvModal(false);
          setCsvInput('');
          setCsvStatusMessage('');
          await refreshAll();
        }, 1500);
      } else {
        setCsvStatusMessage(data.error || 'Failed to import CSV');
      }
    } catch (err: any) {
      setCsvStatusMessage(err.message || 'Import error');
    } finally {
      setIsImporting(false);
    }
  };

  // Add Member submit
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNew(true);
    const res = await addMember({
      name: newMemberName,
      email: newMemberEmail,
      collegeEnrollment: newMemberEnroll || 'N/A',
      jeeRank: newMemberJee ? Number(newMemberJee) : null,
      primaryDepartmentId: newMemberDept,
      role: newMemberRole,
      roleTitle: newMemberRoleTitle,
      branch: newMemberBranch,
      currentSemester: newMemberSem,
    });
    setIsSubmittingNew(false);
    if (res.success) {
      setShowAddModal(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberEnroll('');
      setNewMemberJee('');
      await refreshAll();
    } else {
      alert(res.error || 'Failed to add member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <Users className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Enactus VIPS-TC Directory</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">Member & Staff Management</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Directory, registration approval queue, and member lifecycle governance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selective / Full Export Button */}
          <button
            onClick={() => {
              setExportScope(selectedRowIds.length > 0 ? 'selected' : 'filtered');
              setShowExportModal(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-[#E3EBE7] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#263832] hover:bg-[#DDF7EF] hover:border-[#2FC3A5] transition shadow-sm"
          >
            <Download className="h-4 w-4 text-[#2FC3A5]" />
            <span>
              Export {selectedRowIds.length > 0 ? `Selected (${selectedRowIds.length})` : 'Spreadsheet'}
            </span>
          </button>

          {permissions.canManageMembers && (
            <>
              <button
                onClick={() => setShowCsvModal(true)}
                className="flex items-center gap-2 rounded-xl border border-[#E3EBE7] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#263832] hover:bg-[#DDF7EF] hover:border-[#2FC3A5] transition shadow-sm"
              >
                <Upload className="h-4 w-4 text-[#2FC3A5]" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Member</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E3EBE7] pb-2">
        <button
          onClick={() => {
            setActiveTab('active');
            setSelectedRowIds([]);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'active'
              ? 'bg-[#2FC3A5] text-white shadow-sm'
              : 'text-[#637d74] hover:text-[#263832] hover:bg-white'
          }`}
        >
          <span>Active Roster</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-[#E3EBE7] text-[#263832]'
          }`}>
            {activeMembers.length}
          </span>
        </button>

        {isHRAdmin && (
          <button
            onClick={() => {
              setActiveTab('pending');
              setSelectedRowIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'pending'
                ? 'bg-[#2FC3A5] text-white shadow-sm'
                : 'text-[#637d74] hover:text-[#263832] hover:bg-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Pending Approvals</span>
            {pendingMembers.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'pending' ? 'bg-white text-[#2FC3A5]' : 'bg-[#2FC3A5] text-white animate-pulse'
              }`}>
                {pendingMembers.length}
              </span>
            )}
          </button>
        )}

        {isHRAdmin && (
          <button
            onClick={() => {
              setActiveTab('inactive');
              setSelectedRowIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'inactive'
                ? 'bg-[#2FC3A5] text-white shadow-sm'
                : 'text-[#637d74] hover:text-[#263832] hover:bg-white'
            }`}
          >
            <span>Suspended & Terminated</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'inactive' ? 'bg-white/20 text-white' : 'bg-[#E3EBE7] text-[#263832]'
            }`}>
              {inactiveMembers.length}
            </span>
          </button>
        )}
      </div>

      {/* Sensitive field privacy notification banner */}
      {!isAuthorizedSensitive && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#E3EBE7] bg-[#E7F3D7] p-3 text-xs text-[#0D5143]">
          <Lock className="h-4 w-4 shrink-0 text-[#2FC3A5]" />
          <span>
            <strong>Directory Privacy Shield Active:</strong> Sensitive fields (College Enrollment Number and JEE Rank) are masked for general members in accordance with Enactus society governance. Authorized HR administrators have full access.
          </span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-sm">
        {/* Search Input */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8a9e96]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, role, or branch..."
            className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] pl-9 pr-4 py-2 text-xs text-[#263832] placeholder-[#8a9e96] focus:outline-none focus:border-[#2FC3A5]"
          />
        </div>

        {/* Department Filter */}
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

        {/* Role Filter */}
        <div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
          >
            <option value="ALL">All Roles</option>
            <option value="president">President</option>
            <option value="vp_1">Vice President 1</option>
            <option value="vp_2">Vice President 2</option>
            <option value="vp_3">Vice President 3</option>
            <option value="secretary">Secretary</option>
            <option value="hr_head">HR Head</option>
            <option value="dept_head">Department Head</option>
            <option value="secondary_hr">Secondary HR</option>
            <option value="general_member">General Member</option>
          </select>
        </div>

        {/* Semester Filter */}
        <div>
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Floating Selected Rows Action Bar */}
      {selectedRowIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#DDF7EF] border border-[#2FC3A5] text-xs font-semibold text-[#0D5143] animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#2FC3A5]" />
            <span>{selectedRowIds.length} member(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setExportScope('selected');
                setShowExportModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#2FC3A5] text-white hover:bg-[#28af94] transition"
            >
              Export Selected
            </button>
            <button
              onClick={() => setSelectedRowIds([])}
              className="px-3 py-1.5 rounded-lg border border-[#2FC3A5] text-[#0D5143] hover:bg-white transition"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Members Sheet / Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E3EBE7] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#263832]">
            <thead className="border-b border-[#E3EBE7] bg-[#F7F9F7] uppercase text-[10px] font-bold tracking-wider text-[#637d74]">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    title="Toggle select all on page"
                    className="text-[#637d74] hover:text-[#2FC3A5]"
                  >
                    {filteredMembers.length > 0 && selectedRowIds.length === filteredMembers.length ? (
                      <CheckSquare className="h-4 w-4 text-[#2FC3A5]" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('name'); setSortOrder('asc'); }
                  }}
                  className="cursor-pointer px-4 py-3.5 hover:text-[#2FC3A5]"
                >
                  <div className="flex items-center gap-1">
                    <span>Member & ID</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Designation / Role</th>
                <th
                  onClick={() => {
                    if (sortBy === 'department') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('department'); setSortOrder('asc'); }
                  }}
                  className="cursor-pointer px-4 py-3.5 hover:text-[#2FC3A5]"
                >
                  <div className="flex items-center gap-1">
                    <span>Department</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Academic & Branch</th>
                {isAuthorizedSensitive && (
                  <>
                    <th className="px-4 py-3.5 text-[#0D5143]">College Enrollment</th>
                    <th className="px-4 py-3.5 text-[#0D5143]">Email</th>
                  </>
                )}
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EBE7]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAuthorizedSensitive ? 8 : 6}
                    className="py-12 text-center text-[#8a9e96]"
                  >
                    No members match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const dept = departments.find((d) => d.id === member.primaryDepartmentId);
                  const isSelected = selectedRowIds.includes(member.id);

                  return (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-[#DDF7EF]/40' : 'hover:bg-[#F7F9F7]'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleRow(member.id, e)}
                          className="text-[#8a9e96] hover:text-[#2FC3A5]"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-[#2FC3A5]" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* Name & ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="h-8 w-8 rounded-full object-cover shrink-0 border border-[#E3EBE7]"
                          />
                          <div>
                            <div className="font-bold text-[#263832] hover:text-[#2FC3A5] transition">
                              {member.name}
                            </div>
                            <div className="text-[10px] text-[#8a9e96] font-mono">
                              {member.memberId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[#263832]">{member.roleTitle}</div>
                        <div className="text-[10px] text-[#637d74] capitalize">
                          {member.role.replace(/_/g, ' ')}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: dept?.color || '#2FC3A5' }}
                          />
                          <span className="font-medium text-[#263832]">
                            {dept ? dept.name : member.primaryDepartmentId}
                          </span>
                        </div>
                      </td>

                      {/* Academic */}
                      <td className="px-4 py-3.5">
                        <div className="text-[#263832]">{member.branch}</div>
                        <div className="text-[10px] text-[#8a9e96]">
                          Sem {member.currentSemester} • Joined {member.yearOfJoining}
                        </div>
                      </td>

                      {/* Sensitive fields (if authorized) */}
                      {isAuthorizedSensitive && (
                        <>
                          <td className="px-4 py-3.5 font-mono text-[#263832]">
                            {member.collegeEnrollment || 'N/A'}
                          </td>
                          <td className="px-4 py-3.5 text-[#637d74]">
                            {member.email}
                          </td>
                        </>
                      )}

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {member.approvalStatus === 'PENDING' ? (
                          <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-bold">
                            Pending Approval
                          </span>
                        ) : member.membershipStatus === 'SUSPENDED' ? (
                          <span className="rounded-full bg-orange-100 text-orange-800 px-2.5 py-0.5 text-[10px] font-bold">
                            Suspended
                          </span>
                        ) : member.membershipStatus === 'TERMINATED' ? (
                          <span className="rounded-full bg-red-100 text-red-800 px-2.5 py-0.5 text-[10px] font-bold">
                            Terminated
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#E7F3D7] text-[#0D5143] px-2.5 py-0.5 text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pending Approval 1-Click Actions */}
                          {member.approvalStatus === 'PENDING' && isHRAdmin ? (
                            <>
                              <button
                                onClick={() => handleLifecycleAction('APPROVE', member)}
                                title="Approve Registration"
                                className="flex items-center gap-1 rounded-lg bg-[#2FC3A5] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#28af94] transition"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => setActionModal({ type: 'REJECT', member })}
                                title="Reject Application"
                                className="flex items-center gap-1 rounded-lg bg-red-50 text-red-600 px-2.5 py-1 text-[11px] font-bold hover:bg-red-100 transition"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setSelectedMember(member)}
                                className="rounded-lg bg-[#F7F9F7] px-2.5 py-1 text-[11px] font-semibold text-[#263832] border border-[#E3EBE7] hover:bg-[#DDF7EF] hover:border-[#2FC3A5] transition"
                              >
                                View File
                              </button>

                              {isHRAdmin && (
                                <>
                                  {member.membershipStatus === 'ACTIVE' || !member.membershipStatus ? (
                                    <button
                                      onClick={() => setActionModal({ type: 'SUSPEND', member })}
                                      title="Suspend Member"
                                      className="p-1 rounded-lg text-orange-600 hover:bg-orange-50 transition"
                                    >
                                      <PauseCircle className="h-4 w-4" />
                                    </button>
                                  ) : member.membershipStatus === 'SUSPENDED' ? (
                                    <button
                                      onClick={() => handleLifecycleAction('REACTIVATE', member)}
                                      title="Reactivate Member"
                                      className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                                    >
                                      <PlayCircle className="h-4 w-4" />
                                    </button>
                                  ) : null}

                                  {member.membershipStatus !== 'TERMINATED' && (
                                    <button
                                      onClick={() => setActionModal({ type: 'TERMINATE', member })}
                                      title="Terminate Membership"
                                      className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* Lifecycle Action Modal (Suspend, Reject, Terminate) */}
      {actionModal.type && actionModal.member && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#263832] mb-1">
              {actionModal.type === 'SUSPEND' && `Suspend Membership: ${actionModal.member.name}`}
              {actionModal.type === 'REJECT' && `Reject Application: ${actionModal.member.name}`}
              {actionModal.type === 'TERMINATE' && `Terminate Membership: ${actionModal.member.name}`}
            </h3>
            <p className="text-xs text-[#637d74] mb-4">
              {actionModal.type === 'TERMINATE'
                ? 'Historical records, attendance logs, and MoMs will be safely preserved in society archives.'
                : 'Please specify an audit reason for society compliance logs.'}
            </p>

            {actionError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                {actionError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#263832]">Reason / Remarks *</label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Inactivity during Semester 4, Graduation, or Voluntary resignation..."
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-2.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionModal({ type: null, member: null });
                  setActionReason('');
                  setActionError('');
                }}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-[#637d74] hover:bg-[#F7F9F7]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction || !actionReason.trim()}
                onClick={() => handleLifecycleAction(actionModal.type!, actionModal.member!)}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition ${
                  actionModal.type === 'TERMINATE'
                    ? 'bg-red-600 hover:bg-red-700'
                    : actionModal.type === 'SUSPEND'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isProcessingAction ? 'Processing...' : `Confirm ${actionModal.type}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Configuration Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <FileSpreadsheet className="h-5 w-5 text-[#2FC3A5]" />
              <h3 className="text-base font-bold text-[#263832]">Export Society Member Data</h3>
            </div>
            <p className="text-xs text-[#637d74] mb-4">
              Configure your format, row scope, and selective columns for export.
            </p>

            {/* Scope Selection */}
            <div className="mb-4">
              <label className="text-xs font-bold text-[#263832] block mb-1.5">Row Scope</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportScope('selected')}
                  disabled={selectedRowIds.length === 0}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition ${
                    exportScope === 'selected'
                      ? 'border-[#2FC3A5] bg-[#DDF7EF] text-[#0D5143]'
                      : 'border-[#E3EBE7] bg-[#F7F9F7] text-[#637d74] disabled:opacity-50'
                  }`}
                >
                  <div className="font-bold">Selected Rows Only</div>
                  <div className="text-[10px] text-[#8a9e96]">{selectedRowIds.length} members checked</div>
                </button>
                <button
                  type="button"
                  onClick={() => setExportScope('filtered')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition ${
                    exportScope === 'filtered'
                      ? 'border-[#2FC3A5] bg-[#DDF7EF] text-[#0D5143]'
                      : 'border-[#E3EBE7] bg-[#F7F9F7] text-[#637d74]'
                  }`}
                >
                  <div className="font-bold">All Filtered Rows</div>
                  <div className="text-[10px] text-[#8a9e96]">{filteredMembers.length} members matching filters</div>
                </button>
              </div>
            </div>

            {/* Format Selection */}
            <div className="mb-4">
              <label className="text-xs font-bold text-[#263832] block mb-1.5">File Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat('xlsx')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition ${
                    exportFormat === 'xlsx'
                      ? 'border-[#2FC3A5] bg-[#DDF7EF] text-[#0D5143]'
                      : 'border-[#E3EBE7] bg-[#F7F9F7] text-[#637d74]'
                  }`}
                >
                  <div className="font-bold">Excel Workbook (.xlsx)</div>
                  <div className="text-[10px] text-[#8a9e96]">Styled headers & grid format</div>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition ${
                    exportFormat === 'csv'
                      ? 'border-[#2FC3A5] bg-[#DDF7EF] text-[#0D5143]'
                      : 'border-[#E3EBE7] bg-[#F7F9F7] text-[#637d74]'
                  }`}
                >
                  <div className="font-bold">CSV Document (.csv)</div>
                  <div className="text-[10px] text-[#8a9e96]">Universal UTF-8 data exchange</div>
                </button>
              </div>
            </div>

            {/* Column Selector */}
            <div className="mb-5">
              <label className="text-xs font-bold text-[#263832] block mb-1.5">Include Columns</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl border border-[#E3EBE7] bg-[#F7F9F7]">
                {[
                  { key: 'memberId', label: 'Member ID' },
                  { key: 'name', label: 'Full Name' },
                  { key: 'roleTitle', label: 'Designation' },
                  { key: 'role', label: 'System Role' },
                  { key: 'department', label: 'Department' },
                  { key: 'branch', label: 'Branch' },
                  { key: 'semester', label: 'Semester' },
                  { key: 'yearOfJoining', label: 'Joining Year' },
                  { key: 'membershipStatus', label: 'Status' },
                  ...(isAuthorizedSensitive
                    ? [
                        { key: 'email', label: 'Email' },
                        { key: 'enrollment', label: 'Enrollment No' },
                        { key: 'jeeRank', label: 'JEE Rank' },
                      ]
                    : []),
                ].map((col) => (
                  <label key={col.key} className="flex items-center gap-2 text-xs text-[#263832] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportColumns[col.key] !== false}
                      onChange={(e) =>
                        setExportColumns((prev) => ({ ...prev, [col.key]: e.target.checked }))
                      }
                      className="rounded border-[#E3EBE7] text-[#2FC3A5] focus:ring-[#2FC3A5]"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-[#637d74] hover:bg-[#F7F9F7]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunExport}
                className="flex items-center gap-1.5 rounded-xl bg-[#2FC3A5] px-4 py-2 text-xs font-bold text-white hover:bg-[#28af94] transition shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Generate Export</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#263832] mb-1">Onboard New Society Member</h3>
            <p className="text-xs text-[#637d74] mb-4">
              Add individual record to the active member database with automatic ID assignment.
            </p>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g. Rohini Sen"
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="e.g. rohini@enactusvips.org"
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#263832]">College Enrollment Number</label>
                  <input
                    type="text"
                    value={newMemberEnroll}
                    onChange={(e) => setNewMemberEnroll(e.target.value)}
                    placeholder="e.g. 04517702025"
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">JEE Rank (Optional)</label>
                  <input
                    type="number"
                    value={newMemberJee}
                    onChange={(e) => setNewMemberJee(e.target.value)}
                    placeholder="e.g. 18200"
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Primary Department *</label>
                  <select
                    value={newMemberDept}
                    onChange={(e) => setNewMemberDept(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Hierarchy Role</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  >
                    <option value="general_member">General Member</option>
                    <option value="secondary_hr">Secondary HR</option>
                    <option value="dept_head">Department Head</option>
                    <option value="hr_head">HR Head</option>
                    <option value="secretary">Secretary</option>
                    <option value="vp_1">Vice President</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Designation / Role Title</label>
                  <input
                    type="text"
                    value={newMemberRoleTitle}
                    onChange={(e) => setNewMemberRoleTitle(e.target.value)}
                    placeholder="e.g. Operations Executive"
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Current Semester</label>
                  <select
                    value={newMemberSem}
                    onChange={(e) => setNewMemberSem(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">College Branch</label>
                <input
                  type="text"
                  value={newMemberBranch}
                  onChange={(e) => setNewMemberBranch(e.target.value)}
                  placeholder="e.g. Computer Science / BBA / Law"
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#637d74] hover:bg-[#F7F9F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="rounded-xl bg-[#2FC3A5] px-5 py-2 text-xs font-bold text-white hover:bg-[#28af94] transition shadow-sm"
                >
                  {isSubmittingNew ? 'Creating...' : 'Onboard Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#263832] mb-1">Bulk Onboard Members via CSV</h3>
            <p className="text-xs text-[#637d74] mb-3">
              Paste CSV text with headers: <code>Name, Email, Enrollment, Department, Role, Branch, Semester</code>
            </p>

            {csvStatusMessage && (
              <div className="mb-3 rounded-xl border border-[#2FC3A5] bg-[#DDF7EF] p-3 text-xs text-[#0D5143]">
                {csvStatusMessage}
              </div>
            )}

            <form onSubmit={handleImportCSV}>
              <textarea
                rows={8}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="Name, Email, Enrollment, Department, Role, Branch, Semester&#10;Kavita Sen, kavita.sen@enactusvips.org, 04517702200, Finance, Member, B.Com, 3&#10;Rahul Nair, rahul.nair@enactusvips.org, 04517702201, Digital Operations, Developer, CSE, 3"
                className="w-full rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 font-mono text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
              />

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#637d74] hover:bg-[#F7F9F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !csvInput.trim()}
                  className="rounded-xl bg-[#2FC3A5] px-5 py-2 text-xs font-bold text-white hover:bg-[#28af94] transition shadow-sm"
                >
                  {isImporting ? 'Importing...' : 'Run Bulk Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
