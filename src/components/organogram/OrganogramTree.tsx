'use client';

import React, { useState } from 'react';
import { Member, Department } from '@/types';
import {
  ChevronDown,
  ChevronRight,
  User,
  Shield,
  Building,
  Mail,
  GraduationCap,
  Calendar,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface OrganogramProps {
  members: Member[];
  departments: Department[];
  selectedDepartmentId?: string;
  onSelectMember: (member: Member) => void;
}

export function OrganogramTree({
  members,
  departments,
  selectedDepartmentId,
  onSelectMember,
}: OrganogramProps) {
  // Collapsible nodes state
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleCollapse = (nodeKey: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  // Find leadership tiers
  const president = members.find((m) => m.role === 'president');
  const vps = members.filter((m) => ['vp_1', 'vp_2', 'vp_3'].includes(m.role));
  const secretaries = members.filter((m) => m.role === 'secretary');
  const hrHead = members.find((m) => m.role === 'hr_head');

  // Filter departments if department filter is active
  const activeDepartments = selectedDepartmentId && selectedDepartmentId !== 'ALL'
    ? departments.filter((d) => d.id === selectedDepartmentId)
    : departments.filter((d) => d.isActive);

  // Render Member Card in TeamHub light theme
  const renderMemberCard = (
    member: Member,
    tierColor: string = 'border-[#E3EBE7] bg-white',
    extraBadge?: string
  ) => {
    return (
      <div
        onClick={() => onSelectMember(member)}
        className={`group relative flex w-64 cursor-pointer items-center gap-3 rounded-2xl border p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#2FC3A5] hover:shadow-md ${tierColor}`}
      >
        <div className="relative">
          <img
            src={member.avatar}
            alt={member.name}
            className="h-12 w-12 rounded-xl border border-[#E3EBE7] object-cover group-hover:border-[#2FC3A5]"
          />
          <span
            className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2FC3A5] ring-2 ring-white"
            title="Active Member"
          >
            <CheckCircle className="h-3 w-3 text-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-[#263832] group-hover:text-[#2FC3A5] transition">
            {member.name}
          </div>
          <div className="truncate text-xs font-semibold text-[#0D5143]">
            {member.roleTitle}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#8a9e96]">
            <span>{member.memberId}</span>
            {extraBadge && (
              <span className="rounded bg-[#E7F3D7] px-1.5 py-0.2 text-[9px] font-bold text-[#0D5143]">
                {extraBadge}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto py-8 scrollbar-thin">
      <div className="flex min-w-[900px] flex-col items-center">
        {/* LEVEL 1: PRESIDENT */}
        {president && (
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#2FC3A5] mb-2">
              Level 1: Society President
            </div>
            {renderMemberCard(
              president,
              'border-[#2FC3A5] bg-[#DDF7EF]/50 ring-2 ring-[#2FC3A5]/30'
            )}
            {/* Connector Line */}
            <div className="h-8 w-0.5 bg-[#2FC3A5]" />
          </div>
        )}

        {/* LEVEL 2: THREE VICE PRESIDENTS */}
        <div className="flex flex-col items-center w-full">
          {/* Horizontal distribution bar */}
          <div className="relative flex justify-center w-full max-w-4xl">
            <div className="absolute top-0 h-0.5 w-3/4 bg-[#2FC3A5]/40" />
          </div>

          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D5143] mt-2 mb-2">
            Level 2: Vice Presidents
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-2">
            {vps.map((vp) => (
              <div key={vp.id} className="flex flex-col items-center">
                <div className="h-4 w-0.5 bg-[#2FC3A5]/50 -mt-2 mb-2" />
                {renderMemberCard(
                  vp,
                  'border-[#E3EBE7] bg-white hover:border-[#2FC3A5]'
                )}
              </div>
            ))}
          </div>

          {/* Connector Line to Secretaries */}
          <div className="h-8 w-0.5 bg-[#E3EBE7] mt-3" />
        </div>

        {/* LEVEL 3: SECRETARIES & CORE COORDINATION */}
        <div className="flex flex-col items-center w-full">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#263832] mb-2">
            Level 3: General & Joint Secretaries
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {secretaries.map((sec) => (
              <div key={sec.id}>
                {renderMemberCard(
                  sec,
                  'border-[#E3EBE7] bg-white hover:border-[#2FC3A5]'
                )}
              </div>
            ))}
          </div>
          <div className="h-8 w-0.5 bg-[#E3EBE7] mt-2" />
        </div>

        {/* LEVEL 4: HR DEPARTMENT HEAD */}
        {hrHead && (
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D5143] mb-2">
              Level 4: Human Resources Leadership
            </div>
            {renderMemberCard(
              hrHead,
              'border-[#2FC3A5] bg-[#E7F3D7] hover:border-[#0D5143]'
            )}
            <div className="h-8 w-0.5 bg-[#E3EBE7]" />
          </div>
        )}

        {/* LEVEL 5 & 6 & 7: INDEPENDENT DEPARTMENT HUBS */}
        <div className="w-full mt-4">
          <div className="text-center text-[11px] font-bold uppercase tracking-wider text-[#637d74] mb-6">
            Levels 5, 6 & 7: Departmental Operations, Secondary HRs & Members
          </div>

          {/* Department Cards Grid / Branches */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeDepartments.map((dept) => {
              const isCollapsed = Boolean(collapsedNodes[dept.id]);
              const deptHead = members.find(
                (m) =>
                  (m.role === 'dept_head' || m.roleTitle.toLowerCase().includes('head')) &&
                  (m.assignedDepartmentId === dept.id || m.primaryDepartmentId === dept.id)
              );
              const secondaryHr = members.find(
                (m) =>
                  m.role === 'secondary_hr' &&
                  (m.assignedDepartmentId === dept.id || m.primaryDepartmentId === dept.id)
              );
              const deptMembers = members.filter(
                (m) =>
                  m.primaryDepartmentId === dept.id &&
                  m.role === 'general_member'
              );

              return (
                <div
                  key={dept.id}
                  className="rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-sm flex flex-col"
                >
                  {/* Department Header */}
                  <div className="flex items-center justify-between border-b border-[#E3EBE7] pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: dept.color || '#2FC3A5' }}
                      />
                      <h4 className="font-bold text-[#263832] text-sm">{dept.name}</h4>
                    </div>
                    <button
                      onClick={() => toggleCollapse(dept.id)}
                      className="rounded-lg p-1 text-[#8a9e96] hover:bg-[#F7F9F7] hover:text-[#263832] transition"
                      title={isCollapsed ? 'Expand Department' : 'Collapse Department'}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="mt-4 space-y-4 flex-1">
                      {/* Department Head */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#637d74] mb-1.5">
                          Department Head
                        </div>
                        {deptHead ? (
                          renderMemberCard(
                            deptHead,
                            'border-[#E3EBE7] bg-[#F7F9F7] hover:border-[#2FC3A5]'
                          )
                        ) : (
                          <div className="rounded-xl border border-dashed border-[#E3EBE7] p-2 text-center text-xs text-[#8a9e96]">
                            No head assigned
                          </div>
                        )}
                      </div>

                      {/* Secondary HR */}
                      {secondaryHr && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#0D5143] mb-1.5">
                            Secondary HR Rep
                          </div>
                          {renderMemberCard(
                            secondaryHr,
                            'border-[#2FC3A5]/40 bg-[#DDF7EF]/40 hover:border-[#2FC3A5]',
                            'HR Link'
                          )}
                        </div>
                      )}

                      {/* General Members */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#637d74] mb-1.5 flex items-center justify-between">
                          <span>Team Members</span>
                          <span>({deptMembers.length})</span>
                        </div>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                          {deptMembers.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#E3EBE7] p-2 text-center text-xs text-[#8a9e96]">
                              No members
                            </div>
                          ) : (
                            deptMembers.map((m) => (
                              <div
                                key={m.id}
                                onClick={() => onSelectMember(m)}
                                className="flex items-center justify-between rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-2 text-xs hover:border-[#2FC3A5] hover:bg-white cursor-pointer transition shadow-2xs"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <img
                                    src={m.avatar}
                                    alt={m.name}
                                    className="h-6 w-6 rounded-full object-cover border border-[#E3EBE7]"
                                  />
                                  <span className="font-semibold text-[#263832] truncate">{m.name}</span>
                                </div>
                                <span className="text-[10px] text-[#8a9e96] shrink-0 font-mono">
                                  {m.memberId}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
