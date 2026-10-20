import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { Member, RoleType } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { csvData } = await req.json();
    if (!csvData || typeof csvData !== 'string') {
      return errorResponse('Invalid CSV data provided', 400);
    }

    const db = getDatabase();
    const lines = csvData
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return errorResponse('CSV must contain a header row and at least one member row', 400);
    }

    // Expected headers: Name, Email, Enrollment, Department, Role, Branch, Semester
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h.includes('name'));
    const emailIdx = headers.findIndex((h) => h.includes('email'));
    const enrollIdx = headers.findIndex((h) => h.includes('enroll') || h.includes('roll'));
    const deptIdx = headers.findIndex((h) => h.includes('dept') || h.includes('department'));
    const roleIdx = headers.findIndex((h) => h.includes('role') || h.includes('designation'));
    const branchIdx = headers.findIndex((h) => h.includes('branch'));
    const semIdx = headers.findIndex((h) => h.includes('sem'));

    if (nameIdx === -1 || emailIdx === -1) {
      return errorResponse('CSV header must contain at least "Name" and "Email" columns', 400);
    }

    const importedMembers: Member[] = [];
    const skippedEmails: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const name = cols[nameIdx];
      const email = cols[emailIdx];
      if (!name || !email) continue;

      // Duplicate check
      const exists = db.members.some(
        (m) => m.email.toLowerCase() === email.toLowerCase()
      );
      if (exists) {
        skippedEmails.push(email);
        continue;
      }

      const collegeEnrollment = enrollIdx !== -1 && cols[enrollIdx] ? cols[enrollIdx] : 'N/A';
      const deptName = deptIdx !== -1 && cols[deptIdx] ? cols[deptIdx].toLowerCase() : '';

      // Match department
      const matchedDept = db.departments.find(
        (d) =>
          d.id.toLowerCase() === deptName ||
          d.name.toLowerCase().includes(deptName)
      ) || db.departments[0];

      const rawRole = roleIdx !== -1 && cols[roleIdx] ? cols[roleIdx].toLowerCase() : 'general_member';
      let role: RoleType = 'general_member';
      if (rawRole.includes('president')) role = 'president';
      else if (rawRole.includes('vp')) role = 'vp_1';
      else if (rawRole.includes('secretary')) role = 'secretary';
      else if (rawRole.includes('hr head')) role = 'hr_head';
      else if (rawRole.includes('head')) role = 'dept_head';
      else if (rawRole.includes('secondary')) role = 'secondary_hr';

      const year = new Date().getFullYear();
      const count = db.members.length + importedMembers.length + 1;
      const memberId = `ENVIPS-${year}-${String(count).padStart(3, '0')}`;

      const newMember: Member = {
        id: `mem-${Date.now()}-${i}`,
        memberId,
        name,
        email,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        collegeEnrollment,
        currentSemester: semIdx !== -1 && Number(cols[semIdx]) ? Number(cols[semIdx]) : 3,
        academicYear: '2nd Year',
        branch: branchIdx !== -1 && cols[branchIdx] ? cols[branchIdx] : 'Engineering/BBA',
        yearOfJoining: year,
        primaryDepartmentId: matchedDept.id,
        role,
        roleTitle: cols[roleIdx] || 'Member',
        status: 'Active',
        approvalStatus: 'APPROVED',
        membershipStatus: 'ACTIVE',
        authProvider: 'email',
        createdAt: new Date().toISOString(),
      };

      importedMembers.push(newMember);
    }

    db.members.push(...importedMembers);
    saveDatabase(db);

    return jsonResponse({
      success: true,
      importedCount: importedMembers.length,
      skippedCount: skippedEmails.length,
      skippedEmails,
      importedMembers,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to import CSV members', 500);
  }
}
