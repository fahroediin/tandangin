import { prisma } from './db';

export type AuditAction =
    | 'task_created'
    | 'document_uploaded'
    | 'field_added'
    | 'field_removed'
    | 'signature_applied'
    | 'task_sent'
    | 'task_viewed'
    | 'task_signed'
    | 'task_completed'
    | 'task_declined'
    | 'task_cancelled'
    | 'recipient_added'
    | 'recipient_removed';

interface AuditMetadata {
    [key: string]: string | number | boolean | null | undefined;
}

export async function logAuditAction(
    taskId: string,
    action: AuditAction,
    userId: string,
    metadata?: AuditMetadata
): Promise<void> {
    await prisma.auditLog.create({
        data: {
            taskId,
            action,
            userId,
            details: metadata ? JSON.stringify(metadata) : null,
            ipAddress: null, // Will be set from request context
            userAgent: null, // Will be set from request context
        },
    });
}

export async function getAuditLogs(taskId: string) {
    return prisma.auditLog.findMany({
        where: { taskId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: { createdAt: 'asc' },
    });
}

export function formatAuditAction(action: AuditAction): string {
    const actionLabels: Record<AuditAction, string> = {
        task_created: 'Task Created',
        document_uploaded: 'Document Uploaded',
        field_added: 'Field Added',
        field_removed: 'Field Removed',
        signature_applied: 'Signature Applied',
        task_sent: 'Task Sent',
        task_viewed: 'Task Viewed',
        task_signed: 'Task Signed',
        task_completed: 'Task Completed',
        task_declined: 'Task Declined',
        task_cancelled: 'Task Cancelled',
        recipient_added: 'Recipient Added',
        recipient_removed: 'Recipient Removed',
    };
    return actionLabels[action] || action;
}
