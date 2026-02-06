import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { embedSignature, addTextField, addDateField } from '@/lib/pdfService';
import fs from 'fs/promises';
import path from 'path';

interface FieldData {
    id: string;
    type: string;
    value?: string;
}

// POST /api/sign/[token]/complete - Complete signing and apply signatures
export async function POST(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = params;
        const { fields } = await req.json() as { fields: FieldData[] };

        // Find recipient by signing token
        const recipient = await prisma.recipient.findFirst({
            where: { signingToken: token },
            include: {
                task: {
                    include: {
                        documents: true,
                        recipients: true,
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

        if (recipient.status === 'signed') {
            return NextResponse.json(
                { error: 'Already signed', code: 'ALREADY_SIGNED' },
                { status: 400 }
            );
        }

        const document = recipient.task.documents[0];
        if (!document) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        // Load the current PDF
        const pdfPath = path.join(process.cwd(), 'uploads', path.basename(document.storagePath));
        let pdfBytes = await fs.readFile(pdfPath);

        // Get field definitions from DB
        const dbFields = await prisma.field.findMany({
            where: {
                documentId: document.id,
                recipientId: recipient.id,
            },
        });

        // Apply each field value to the PDF
        for (const fieldData of fields) {
            const dbField = dbFields.find(f => f.id === fieldData.id);
            if (!dbField || !fieldData.value) continue;

            const position = {
                x: dbField.x,
                y: dbField.y,
                width: dbField.width,
                height: dbField.height,
                page: dbField.page,
            };

            // Apply based on field type
            if (dbField.type === 'signature' || dbField.type === 'initials') {
                const result = await embedSignature(
                    new Uint8Array(pdfBytes),
                    fieldData.value,
                    position
                );
                pdfBytes = Buffer.from(result);
            } else if (dbField.type === 'text' || dbField.type === 'name') {
                const result = await addTextField(
                    new Uint8Array(pdfBytes),
                    fieldData.value,
                    position
                );
                pdfBytes = Buffer.from(result);
            } else if (dbField.type === 'date') {
                const result = await addDateField(
                    new Uint8Array(pdfBytes),
                    new Date(fieldData.value),
                    position
                );
                pdfBytes = Buffer.from(result);
            }

            // Update field value in DB
            await prisma.field.update({
                where: { id: dbField.id },
                data: { value: fieldData.value },
            });
        }

        // Save the updated PDF
        await fs.writeFile(pdfPath, Buffer.from(pdfBytes));

        // Update recipient status
        await prisma.recipient.update({
            where: { id: recipient.id },
            data: {
                status: 'signed',
                signedAt: new Date(),
            },
        });

        // Log audit action
        await prisma.auditLog.create({
            data: {
                taskId: recipient.taskId,
                action: 'task_signed',
                userId: recipient.id,
                details: JSON.stringify({
                    recipientName: recipient.name,
                    recipientEmail: recipient.email,
                    fieldsCompleted: fields.filter(f => f.value).length,
                }),
            },
        });

        // Check if all recipients have signed
        const allRecipients = recipient.task.recipients;
        const pendingRecipients = allRecipients.filter(r =>
            r.id !== recipient.id && r.status !== 'signed' && r.role !== 'cc'
        );

        if (pendingRecipients.length === 0) {
            // All signers have completed - mark task as completed
            await prisma.task.update({
                where: { id: recipient.taskId },
                data: { status: 'completed' },
            });

            await prisma.auditLog.create({
                data: {
                    taskId: recipient.taskId,
                    action: 'task_completed',
                    userId: recipient.id,
                    details: JSON.stringify({
                        completedBy: 'all_recipients_signed',
                    }),
                },
            });

            // TODO: Send completion email to task creator
        }

        return NextResponse.json({
            success: true,
            message: 'Signature completed successfully',
        });
    } catch (error) {
        console.error('Error completing signature:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
