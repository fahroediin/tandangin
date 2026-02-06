import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendSigningInvitation } from '@/lib/emailService';
import { v4 as uuidv4 } from 'uuid';
import { logAuditAction } from '@/lib/auditService';

// POST /api/tasks/[id]/send - Send task to recipients
export async function POST(
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
                recipients: true,
                documents: true,
                creator: { select: { name: true, email: true } },
            },
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        if (task.creatorId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Validate task has recipients
        if (task.recipients.length === 0) {
            return NextResponse.json(
                { error: 'No recipients added to this task' },
                { status: 400 }
            );
        }

        // Validate task has at least one document
        if (task.documents.length === 0) {
            return NextResponse.json(
                { error: 'No documents attached to this task' },
                { status: 400 }
            );
        }

        const emailResults: { recipientId: string; email: string; success: boolean }[] = [];

        // Generate signing tokens and send emails to each recipient
        for (const recipient of task.recipients) {
            // Skip CC recipients (they don't sign)
            if (recipient.role === 'cc') continue;

            // Generate unique signing token if not exists
            let signingToken = recipient.signingToken;
            if (!signingToken) {
                signingToken = uuidv4();
                await prisma.recipient.update({
                    where: { id: recipient.id },
                    data: {
                        signingToken,
                        status: 'pending',
                    },
                });
            }

            // Send invitation email
            const emailSent = await sendSigningInvitation(
                { name: recipient.name, email: recipient.email },
                {
                    id: task.id,
                    name: task.name,
                    creatorName: task.creator?.name || 'Someone'
                },
                signingToken
            );

            emailResults.push({
                recipientId: recipient.id,
                email: recipient.email,
                success: emailSent,
            });
        }

        // Update task status to pending
        await prisma.task.update({
            where: { id: task.id },
            data: { status: 'pending' },
        });

        // Log audit action
        await logAuditAction(task.id, 'task_sent', session.user.id, {
            recipientCount: task.recipients.length,
            emailsSent: emailResults.filter(r => r.success).length,
        });

        const successCount = emailResults.filter(r => r.success).length;
        const failCount = emailResults.filter(r => !r.success).length;

        return NextResponse.json({
            success: true,
            message: `Task sent to ${successCount} recipient(s)`,
            emailResults,
            warnings: failCount > 0 ? `Failed to send email to ${failCount} recipient(s)` : undefined,
        });
    } catch (error) {
        console.error('Error sending task:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
