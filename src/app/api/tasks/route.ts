import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { Task } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDatabase();
  return jsonResponse(db.tasks);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      departmentId,
      assignedMemberId,
      createdById,
      priority,
      deadline,
      estimatedEffortHours,
    } = body;

    if (!title || !category || !departmentId || !assignedMemberId || !createdById || !deadline) {
      return errorResponse('Missing required fields for task creation', 400);
    }

    const db = getDatabase();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      description: description || '',
      category,
      departmentId,
      assignedMemberId,
      createdById,
      priority: priority || 'Medium',
      status: 'To Do',
      deadline,
      estimatedEffortHours: Number(estimatedEffortHours) || 2,
      actualEffortHours: 0,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    db.tasks.push(newTask);

    // Notify assigned member
    db.notifications.push({
      id: `notif-${Date.now()}-${assignedMemberId}`,
      recipientMemberId: assignedMemberId,
      title: 'New Task Assigned',
      message: `You have been assigned: "${newTask.title}". Deadline: ${newTask.deadline}.`,
      type: 'Task',
      link: '/tasks',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase(db);
    return jsonResponse(newTask, 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create task', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return errorResponse('Task ID required', 400);
    }

    const db = getDatabase();
    const index = db.tasks.findIndex((t) => t.id === body.id);
    if (index === -1) {
      return errorResponse('Task not found', 404);
    }

    const current = db.tasks[index];
    const isNowCompleted = body.status === 'Completed' && current.status !== 'Completed';

    const updated: Task = {
      ...current,
      ...body,
      id: current.id,
      completedAt: isNowCompleted ? new Date().toISOString() : current.completedAt,
    };

    // If task is being verified by reviewer
    if (body.isVerified && body.reviewerId) {
      // Prevent self-verification if user is verifying their own task
      if (body.reviewerId === current.assignedMemberId) {
        return errorResponse('Self-verification is not permitted under society governance rules', 403);
      }
      updated.isVerified = true;
      updated.reviewerId = body.reviewerId;
      if (typeof body.reviewerScore === 'number') {
        updated.reviewerScore = Math.min(10, Math.max(1, body.reviewerScore));
      }

      // Notify task owner of verification
      db.notifications.push({
        id: `notif-${Date.now()}-${current.assignedMemberId}`,
        recipientMemberId: current.assignedMemberId,
        title: 'Task Verified',
        message: `Your task "${current.title}" was verified with a rating of ${updated.reviewerScore || 10}/10.`,
        type: 'Task',
        link: '/tasks',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    db.tasks[index] = updated;
    saveDatabase(db);
    return jsonResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update task', 500);
  }
}
