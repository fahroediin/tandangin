import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuditLogs, formatAuditAction } from '@/lib/auditService';
import { prisma } from '@/lib/db';

// GET /api/tasks/[id]/audit - Get audit trail for a task
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
            select: { id: true, creatorId: true, name: true },
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const logs = await getAuditLogs(params.id);

        const formattedLogs = logs.map((log) => ({
            id: log.id,
            action: log.action,
            actionLabel: formatAuditAction(log.action as any),
            user: log.user,
            details: log.details ? JSON.parse(log.details) : null,
            createdAt: log.createdAt,
            ipAddress: log.ipAddress,
        }));

        return NextResponse.json({
            task: { id: task.id, name: task.name },
            logs: formattedLogs,
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
