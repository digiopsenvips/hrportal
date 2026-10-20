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
  Phone,
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

  // Render Member Card
  const renderMemberCard = (
    member: Member,
    tierColor: string = 'border-amber-500/30 bg-slate-800/80',
    extraBadge?: string
  ) => {
    return (
      <div
        onClick={() => onSelectMember(member)}
        className={`group relative flex w-64 cursor-pointer items-center gap-3 rounded-2xl border p-3 shadow-lg shadow-black/40 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-400 hover:shadow-amber-500/10 ${tierColor}`}
      >
        <div className="relative">
          <img
            src={member.avatar}
            alt={member.name}
            className="h-12 w-12 rounded-xl border border-slate-700 object-cover group-hover:border-amber-400"
          />
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-900" title="Active Member">
            <CheckCircle className="h-3 w-3 text-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-white group-hover:text-amber-300">
            {member.name}
          </div>
          <div className="truncate text-xs font-semibold text-amber-400">
            {member.roleTitle}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>{member.memberId}</span>
            {extraBadge && (
              <span className="rounded bg-slate-700/80 px-1.5 py-0.2 text-[9px] font-medium text-slate-300">
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
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 mb-2">
              Level 1: Society President
            </div>
            {renderMemberCard(
              president,
              'border-amber-400/80 bg-gradient-to-br from-amber-500/20 via-slate-800 to-slate-900 ring-2 ring-amber-400/30'
            )}
            {/* Connector Line */}
            <div className="h-8 w-0.5 bg-amber-400/50" />
          </div>
        )}

        {/* LEVEL 2: THREE VICE PRESIDENTS */}
        <div className="flex flex-col items-center w-full">
          {/* Horizontal distribution bar */}
          <div className="relative flex justify-center w-full max-w-4xl">
            <div className="absolute top-0 h-0.5 w-3/4 bg-amber-400/40" />
          </div>

          <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 mt-2 mb-2">
            Level 2: Vice Presidents (Individually Identifiable)
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-2">
            {vps.map((vp) => (
              <div key={vp.id} className="flex flex-col items-center">
                <div className="h-4 w-0.5 bg-blue-400/50 -mt-2 mb-2" />
                {renderMemberCard(
                  vp,
                  'border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-slate-800 to-slate-900'
                )}
              </div>
            ))}
          </div>

          {/* Connector Line to Secretaries */}
          <div className="h-8 w-0.5 bg-slate-600 mt-3" />
        </div>

        {/* LEVEL 3: SECRETARIES & CORE COORDINATION */}
        <div className="flex flex-col items-center w-full">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 mb-2">
            Level 3: General & Joint Secretaries
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {secretaries.map((sec) => (
              <div key={sec.id}>
                {renderMemberCard(
                  sec,
                  'border-indigo-500/40 bg-gradient-to-br from-indigo-500/10 via-slate-800 to-slate-900'
                )}
              </div>
            ))}
          </div>
          <div className="h-8 w-0.5 bg-slate-600 mt-2" />
        </div>

        {/* LEVEL 4: HR DEPARTMENT HEAD */}
        {hrHead && (
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400 mb-2">
              Level 4: Human Resources Leadership
            </div>
            {renderMemberCard(
              hrHead,
              'border-rose-500/50 bg-gradient-to-br from-rose-500/15 via-slate-800 to-slate-900'
            )}
            <div className="h-8 w-0.5 bg-slate-600" />
          </div>
        )}

        {/* LEVEL 5 & 6 & 7: INDEPENDENT DEPARTMENT HUBS */}
        <div className="w-full mt-4">
          <div className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-6">
            Levels 5, 6 & 7: Departmental Operations, Secondary HRs & Department Members
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
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl shadow-black/30 flex flex-col"
                >
                  {/* Department Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: dept.color }}
                      />
                      <h4 className="font-bold text-white text-sm">{dept.name}</h4>
                    </div>
                    <button
                      onClick={() => toggleCollapse(dept.id)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
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
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Department Head
                        </div>
                        {deptHead ? (
                          renderMemberCard(
                            deptHead,
                            'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400'
                          )
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-800 p-2 text-center text-xs text-slate-400">
                            No head assigned
                          </div>
                        )}
                      </div>

                      {/* Secondary HR Representative */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1.5 flex items-center justify-between">
                          <span>Secondary HR Representative</span>
                          <span className="text-[9px] text-slate-400">From HR Team</span>
                        </div>
                        {secondaryHr ? (
                          renderMemberCard(
                            secondaryHr,
                            'border-rose-500/40 bg-rose-500/5 hover:border-rose-400'
                          )
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-800 p-2 text-center text-xs text-slate-400">
                            No Secondary HR linked
                          </div>
                        )}
                      </div>

                      {/* Department Members */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          <span>Department Members</span>
                          <span>({deptMembers.length})</span>
                        </div>
                        {deptMembers.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-800 p-2 text-center text-xs text-slate-400">
                            No general members yet
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                            {deptMembers.map((member) => (
                              <div
                                key={member.id}
                                onClick={() => onSelectMember(member)}
                                className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-2 hover:border-amber-400/60 hover:bg-slate-800 transition"
                              >
                                <div className="flex items-center gap-2">
                                  <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="h-7 w-7 rounded-lg object-cover"
                                  />
                                  <div>
                                    <div className="text-xs font-semibold text-white">
                                      {member.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {member.roleTitle}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[10px] text-amber-400 font-mono">
                                  Sem {member.currentSemester}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
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
