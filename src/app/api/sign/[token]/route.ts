import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/sign/[token] - Verify token and get task data for signing
export async function GET(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = params;

        // Find recipient by signing token
        const recipient = await prisma.recipient.findFirst({
            where: { signingToken: token },
            include: {
                task: {
                    include: {
                        documents: {
                            select: {
                                id: true,
                                originalName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!recipient) {
            return NextResponse.json(
                { error: 'Invalid signing link', code: 'INVALID_TOKEN' },
                { status: 404 }
            );
        }

        // Check if already signed
        if (recipient.status === 'signed') {
            return NextResponse.json(
                { error: 'Already signed', code: 'ALREADY_SIGNED' },
                { status: 400 }
            );
        }

        // Check if task is cancelled or expired
        if (recipient.task.status === 'cancelled' || recipient.task.status === 'deleted') {
            return NextResponse.json(
                { error: 'This signing request has been cancelled', code: 'EXPIRED' },
                { status: 400 }
            );
        }

        // Get fields assigned to this recipient
        const fields = await prisma.field.findMany({
            where: {
                documentId: recipient.task.documents[0]?.id,
                recipientId: recipient.id,
            },
        });

        // Update recipient status to viewed
        if (recipient.status === 'pending') {
            await prisma.recipient.update({
                where: { id: recipient.id },
                data: {
                    status: 'viewed',
                },
            });

            // Log audit action
            await prisma.auditLog.create({
                data: {
                    taskId: recipient.taskId,
                    action: 'task_viewed',
                    userId: recipient.id, // Use recipient ID for external signers
                    details: JSON.stringify({
                        recipientName: recipient.name,
                        recipientEmail: recipient.email,
                    }),
                },
            });
        }

        return NextResponse.json({
            id: recipient.task.id,
            name: recipient.task.name,
            status: recipient.task.status,
            documents: recipient.task.documents,
            recipient: {
                id: recipient.id,
                name: recipient.name,
                email: recipient.email,
                status: recipient.status,
                color: (recipient as any).color || '#3b82f6',
            },
            fields: fields.map(f => ({
                id: f.id,
                type: f.type,
                x: f.x,
                y: f.y,
                width: f.width,
                height: f.height,
                page: f.page,
                value: f.value,
                recipientId: f.recipientId,
            })),
        });
    } catch (error) {
        console.error('Error verifying signing token:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
