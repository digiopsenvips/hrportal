import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { Department } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDatabase();
  return jsonResponse(db.departments);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return errorResponse('Department name is required', 400);
    }

    const db = getDatabase();
    const slug = body.id || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const exists = db.departments.some((d) => d.id === slug);
    if (exists) {
      return errorResponse(`Department with ID "${slug}" already exists`, 409);
    }

    const newDept: Department = {
      id: slug,
      name: body.name,
      description: body.description || '',
      headMemberId: body.headMemberId || undefined,
      secondaryHrMemberId: body.secondaryHrMemberId || undefined,
      isActive: true,
      color: body.color || '#6366F1',
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    db.departments.push(newDept);
    saveDatabase(db);
    return jsonResponse(newDept, 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create department', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return errorResponse('Department ID is required', 400);
    }

    const db = getDatabase();
    const index = db.departments.findIndex((d) => d.id === body.id);
    if (index === -1) {
      return errorResponse('Department not found', 404);
    }

    const current = db.departments[index];
    const updated: Department = {
      ...current,
      ...body,
      id: current.id,
    };

    db.departments[index] = updated;

    // If head or secondary HR changed, update those member roles accordingly
    if (body.headMemberId && body.headMemberId !== current.headMemberId) {
      const headIdx = db.members.findIndex((m) => m.id === body.headMemberId);
      if (headIdx !== -1) {
        db.members[headIdx].assignedDepartmentId = current.id;
        db.members[headIdx].role = 'dept_head';
        db.members[headIdx].roleTitle = `Head of ${updated.name}`;
      }
    }

    if (body.secondaryHrMemberId && body.secondaryHrMemberId !== current.secondaryHrMemberId) {
      const secIdx = db.members.findIndex((m) => m.id === body.secondaryHrMemberId);
      if (secIdx !== -1) {
        db.members[secIdx].assignedDepartmentId = current.id;
        db.members[secIdx].role = 'secondary_hr';
        db.members[secIdx].roleTitle = `Secondary HR - ${updated.name}`;
      }
    }

    saveDatabase(db);
    return jsonResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update department', 500);
  }
}
