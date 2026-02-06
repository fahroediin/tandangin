import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAuditAction } from '@/lib/auditService';

export const dynamic = 'force-dynamic';

// GET /api/tasks/[id] - Get task details
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const task = await prisma.task.findUnique({
            where: { id: params.id },
            include: {
                documents: true,
                recipients: true,
                fields: true,
                creator: {
                    select: { id: true, name: true, email: true },
                },
                auditLogs: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Log view action
        await logAuditAction(task.id, 'task_viewed', session.user.id);

        return NextResponse.json({ task });
    } catch (error) {
        console.error('Error fetching task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, status, fields } = body;

        const existingTask = await prisma.task.findUnique({
            where: { id: params.id },
        });

        if (!existingTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        if (existingTask.creatorId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const task = await prisma.task.update({
            where: { id: params.id },
            data: {
                name: name || undefined,
                status: status || undefined,
            },
            include: {
                documents: true,
                recipients: true,
                fields: true,
            },
        });

        // Log status change
        if (status && status !== existingTask.status) {
            const actionMap: Record<string, any> = {
                sent: 'task_sent',
                completed: 'task_completed',
                cancelled: 'task_cancelled',
            };
            if (actionMap[status]) {
                await logAuditAction(task.id, actionMap[status], session.user.id);
            }
        }

        return NextResponse.json({ task });
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/tasks/[id] - Delete task (soft delete)
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const existingTask = await prisma.task.findUnique({
            where: { id: params.id },
        });

        if (!existingTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        if (existingTask.creatorId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Soft delete by updating status
        await prisma.task.update({
            where: { id: params.id },
            data: { status: 'deleted' },
        });

        await logAuditAction(params.id, 'task_cancelled', session.user.id);

        return NextResponse.json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
