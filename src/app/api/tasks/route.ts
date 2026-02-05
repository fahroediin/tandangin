import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAuditAction } from '@/lib/auditService';

// GET /api/tasks - List all tasks for current user
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const type = searchParams.get('type');

        const where: any = {
            OR: [
                { creatorId: session.user.id },
                { recipients: { some: { email: session.user.email } } },
            ],
        };

        if (status) {
            where.status = status;
        }
        if (type) {
            where.type = type;
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                documents: true,
                recipients: true,
                creator: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ tasks });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/tasks - Create a new task
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, type, recipients, documentId } = body;

        if (!name) {
            return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                name,
                type: type || 'self',
                status: 'draft',
                creatorId: session.user.id,
                documents: documentId ? {
                    connect: { id: documentId },
                } : undefined,
                recipients: recipients ? {
                    create: recipients.map((r: any, index: number) => ({
                        name: r.name,
                        email: r.email,
                        role: r.role || 'signer',
                        order: r.order || index + 1,
                        status: 'pending',
                    })),
                } : undefined,
            },
            include: {
                documents: true,
                recipients: true,
            },
        });

        await logAuditAction(task.id, 'task_created', session.user.id, {
            taskName: name,
            type,
        });

        return NextResponse.json({ task }, { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
