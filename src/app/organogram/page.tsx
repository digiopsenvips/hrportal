'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { OrganogramTree } from '@/components/organogram/OrganogramTree';
import { MemberDetailModal } from '@/components/members/MemberDetailModal';
import { Member } from '@/types';
import { Network, Filter, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function OrganogramPage() {
  const { members, departments } = useData();
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <Network className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Executive Hierarchy</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">Interactive Society Organogram</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Dynamic Enactus organizational tree • President → 3 VPs → Secretaries → HR Head → Department Heads → Secondary HRs → Members
          </p>
        </div>

        {/* Filter and Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="flex items-center gap-2 rounded-xl border border-[#E3EBE7] bg-white px-3 py-1.5 shadow-sm">
            <Filter className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-transparent text-xs text-[#263832] focus:outline-none"
            >
              <option value="ALL">Entire Society (8 Departments)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} Only
                </option>
              ))}
            </select>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center rounded-xl border border-[#E3EBE7] bg-white p-1 shadow-sm">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0.7, prev - 0.1))}
              className="rounded-lg p-1.5 text-[#637d74] hover:bg-[#F7F9F7] hover:text-[#263832] transition"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-mono text-[#263832] font-semibold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(1.3, prev + 0.1))}
              className="rounded-lg p-1.5 text-[#637d74] hover:bg-[#F7F9F7] hover:text-[#263832] transition"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="rounded-lg p-1.5 text-[#637d74] hover:bg-[#F7F9F7] hover:text-[#263832] ml-1 transition"
              title="Reset Zoom"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tree Canvas Container */}
      <div className="rounded-3xl border border-[#E3EBE7] bg-white p-4 md:p-6 shadow-sm relative overflow-hidden">
        {/* Subtle dot pattern background */}
        <div
          className="absolute inset-0 opacity-[0.25] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#2FC3A5 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div
          className="transition-transform duration-200 origin-top"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <OrganogramTree
            members={members}
            departments={departments}
            selectedDepartmentId={selectedDeptId}
            onSelectMember={(m) => setSelectedMember(m)}
          />
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
