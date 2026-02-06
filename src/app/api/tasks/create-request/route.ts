import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { sendSigningInvitation } from '@/lib/emailService';

// Helper to sanitize filename
function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { taskName, pdfBase64, originalFileName, pageCount, recipients, fields, setOrder } = body;

        if (!taskName || !pdfBase64 || !recipients || recipients.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Save PDF file
        const buffer = Buffer.from(pdfBase64, 'base64');
        const timestamp = Date.now();
        const safeFileName = sanitizeFilename(originalFileName);
        const storedFileName = `${timestamp}-${safeFileName}`;

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            await fs.promises.mkdir(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, storedFileName);
        await writeFile(filePath, buffer);

        // 2. Create Task and Document transactionally
        const task = await prisma.task.create({
            data: {
                name: taskName,
                status: 'pending',
                type: 'request',
                creatorId: session.user.id,
                documents: {
                    create: {
                        originalName: originalFileName,
                        storagePath: storedFileName,
                        pageCount: pageCount || 1,
                    }
                }
            },
            include: {
                documents: true,
                creator: true
            }
        });

        const documentId = task.documents[0].id;

        // 3. Create Recipients and map temp IDs to real IDs
        const recipientMap = new Map<string, string>(); // tempId -> dbId

        for (const r of recipients) {
            // Validate recipient data
            if (!r.email || !r.name) continue;

            const signingToken = randomUUID();

            const createdRecipient = await prisma.recipient.create({
                data: {
                    taskId: task.id,
                    name: r.name,
                    email: r.email,
                    role: r.role || 'signer',
                    order: r.order || 1,
                    color: r.color || '#3b82f6',
                    status: 'pending',
                    signingToken: signingToken,
                }
            });

            // Map the frontend temp ID to the database ID
            if (r.id) {
                recipientMap.set(r.id, createdRecipient.id);
            }
            // Fallback: map by email
            recipientMap.set(r.email, createdRecipient.id);

            // Send email invitation
            try {
                // Should send if no order enforced OR it's the first in order (0 or 1)
                const shouldSend = !setOrder || (r.order || 1) <= 1;

                if (shouldSend) {
                    const taskInfo = {
                        id: task.id,
                        name: task.name,
                        creatorName: task.creator?.name || 'A user',
                    };

                    await sendSigningInvitation(
                        { name: r.name, email: r.email },
                        taskInfo,
                        signingToken
                    );
                }
            } catch (emailError) {
                console.error(`Failed to send email to ${r.email}`, emailError);
            }
        }

        // 4. Create Fields
        if (fields && fields.length > 0) {
            await prisma.field.createMany({
                data: fields.map((f: any) => {
                    // Resolve recipient ID
                    let recipientId = null;
                    if (f.recipientId) {
                        recipientId = recipientMap.get(f.recipientId) || null;
                    }

                    return {
                        taskId: task.id,
                        documentId: documentId,
                        type: f.type,
                        page: f.page,
                        x: f.x,
                        y: f.y,
                        width: f.width,
                        height: f.height,
                        required: f.required,
                        recipientId: recipientId,
                        value: f.value || null
                    };
                })
            });
        }

        return NextResponse.json({
            success: true,
            taskId: task.id,
            message: 'Request created successfully'
        });

    } catch (error) {
        console.error('Error creating request task:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
