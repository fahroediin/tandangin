import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuditLogs, formatAuditAction } from '@/lib/auditService';
import { prisma } from '@/lib/db';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// GET /api/tasks/[id]/audit/pdf - Download Audit Trail PDF
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
                creator: { select: { name: true, email: true } },
                documents: { select: { originalName: true } },
                recipients: { select: { name: true, email: true, status: true } },
            },
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const logs = await getAuditLogs(params.id);

        // Generate PDF
        const pdfBytes = await generateAuditPdf(task, logs);

        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="audit-trail-${task.id}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generating audit PDF:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function generateAuditPdf(task: any, logs: any[]): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 50;
    let currentY = pageHeight - margin;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Helper to add new page if needed
    const checkNewPage = (neededHeight: number) => {
        if (currentY - neededHeight < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = pageHeight - margin;
        }
    };

    // Title
    page.drawText('Audit Trail Report', {
        x: margin,
        y: currentY,
        size: 24,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.4),
    });
    currentY -= 40;

    // Task Information Section
    page.drawText('Task Information', {
        x: margin,
        y: currentY,
        size: 14,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2),
    });
    currentY -= 20;

    const taskInfo = [
        `Task Name: ${task.name}`,
        `Status: ${task.status}`,
        `Type: ${task.type === 'self' ? 'Sign Me' : 'Request E-Sign'}`,
        `Created By: ${task.creator?.name || task.creator?.email || 'Unknown'}`,
        `Created At: ${formatDateTime(task.createdAt)}`,
    ];

    if (task.documents?.length > 0) {
        taskInfo.push(`Documents: ${task.documents.map((d: any) => d.originalName).join(', ')}`);
    }

    for (const info of taskInfo) {
        page.drawText(info, {
            x: margin + 10,
            y: currentY,
            size: 10,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
        });
        currentY -= 15;
    }
    currentY -= 20;

    // Recipients Section (if any)
    if (task.recipients?.length > 0) {
        checkNewPage(60);
        page.drawText('Recipients', {
            x: margin,
            y: currentY,
            size: 14,
            font: helveticaBold,
            color: rgb(0.2, 0.2, 0.2),
        });
        currentY -= 20;

        for (const recipient of task.recipients) {
            page.drawText(`• ${recipient.name} (${recipient.email}) - ${recipient.status}`, {
                x: margin + 10,
                y: currentY,
                size: 10,
                font: helvetica,
                color: rgb(0.3, 0.3, 0.3),
            });
            currentY -= 15;
        }
        currentY -= 20;
    }

    // Audit Events Section
    checkNewPage(40);
    page.drawText('Activity Log', {
        x: margin,
        y: currentY,
        size: 14,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2),
    });
    currentY -= 25;

    // Table Header
    const colWidths = [120, 150, 150, 100];
    const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

    page.drawRectangle({
        x: margin,
        y: currentY - 15,
        width: pageWidth - 2 * margin,
        height: 20,
        color: rgb(0.9, 0.9, 0.95),
    });

    page.drawText('Date & Time', { x: colX[0] + 5, y: currentY - 10, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Action', { x: colX[1] + 5, y: currentY - 10, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('User', { x: colX[2] + 5, y: currentY - 10, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Details', { x: colX[3] + 5, y: currentY - 10, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    currentY -= 25;

    // Table Rows
    for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        checkNewPage(20);

        // Alternate row background
        if (i % 2 === 1) {
            page.drawRectangle({
                x: margin,
                y: currentY - 10,
                width: pageWidth - 2 * margin,
                height: 18,
                color: rgb(0.97, 0.97, 0.97),
            });
        }

        const dateStr = formatDateTime(log.createdAt);
        const actionStr = formatAuditAction(log.action as any);
        const userStr = log.user?.name || log.user?.email || 'System';
        const detailsStr = log.details ? summarizeDetails(JSON.parse(log.details)) : '-';

        page.drawText(truncateText(dateStr, 18), { x: colX[0] + 5, y: currentY - 5, size: 8, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(truncateText(actionStr, 22), { x: colX[1] + 5, y: currentY - 5, size: 8, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(truncateText(userStr, 22), { x: colX[2] + 5, y: currentY - 5, size: 8, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(truncateText(detailsStr, 15), { x: colX[3] + 5, y: currentY - 5, size: 8, font: helvetica, color: rgb(0.3, 0.3, 0.3) });

        currentY -= 18;
    }

    if (logs.length === 0) {
        page.drawText('No audit events recorded.', {
            x: margin + 10,
            y: currentY - 5,
            size: 10,
            font: helvetica,
            color: rgb(0.5, 0.5, 0.5),
        });
        currentY -= 20;
    }

    // Footer
    currentY -= 30;
    checkNewPage(40);

    page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: pageWidth - margin, y: currentY },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 15;

    page.drawText(`Generated by Tandangin on ${formatDateTime(new Date())}`, {
        x: margin,
        y: currentY,
        size: 8,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText('This is an electronically generated document.', {
        x: margin,
        y: currentY - 12,
        size: 8,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
    });

    return await pdfDoc.save();
}

function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 2) + '..';
}

function summarizeDetails(details: any): string {
    if (!details) return '-';
    if (typeof details === 'string') return details;

    // Extract meaningful info from common detail structures
    if (details.taskName) return details.taskName;
    if (details.documentName) return details.documentName;
    if (details.recipientName) return details.recipientName;

    const keys = Object.keys(details);
    if (keys.length === 0) return '-';
    return `${keys[0]}: ${details[keys[0]]}`;
}
