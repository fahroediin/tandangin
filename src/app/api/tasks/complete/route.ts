import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAuditAction } from '@/lib/auditService';
import * as fs from 'fs/promises';
import * as path from 'path';

// POST /api/tasks/complete - Complete a self-sign task
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { taskName, signedPdfBase64, originalFileName, fields, pageCount } = body;

        if (!taskName || !signedPdfBase64 || !originalFileName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create storage directory if not exists
        const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
        await fs.mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const signedFileName = `${timestamp}_signed_${sanitizedName}`;
        const signedFilePath = path.join(uploadsDir, signedFileName);

        // Decode and save signed PDF
        const signedPdfBuffer = Buffer.from(signedPdfBase64, 'base64');
        await fs.writeFile(signedFilePath, signedPdfBuffer);

        // Step 1: Create task with document (no fields yet)
        const task = await prisma.task.create({
            data: {
                name: taskName,
                type: 'self',
                status: 'completed',
                creatorId: session.user.id,
                documents: {
                    create: {
                        originalName: originalFileName,
                        storagePath: signedFilePath,
                        signedPath: signedFilePath,
                        pageCount: pageCount || 1,
                    },
                },
            },
            include: {
                documents: true,
            },
        });

        // Step 2: Create fields with correct documentId
        if (fields && fields.length > 0 && task.documents.length > 0) {
            const documentId = task.documents[0].id;

            await prisma.field.createMany({
                data: fields.map((f: any) => ({
                    taskId: task.id,
                    documentId: documentId,
                    type: f.type,
                    page: f.page || 1,
                    x: f.x || 0,
                    y: f.y || 0,
                    width: f.width || 100,
                    height: f.height || 50,
                    required: f.required !== undefined ? f.required : true,
                    value: f.value || null,
                })),
            });
        }

        // Log audit
        await logAuditAction(task.id, 'task_created', session.user.id, {
            taskName,
            type: 'self',
        });

        await logAuditAction(task.id, 'task_signed', session.user.id, {
            signedBy: session.user.name || session.user.email,
        });

        await logAuditAction(task.id, 'task_completed', session.user.id, {
            completedBy: session.user.name || session.user.email,
        });

        return NextResponse.json({
            success: true,
            taskId: task.id,
            task: {
                ...task,
                signedPdfPath: `/api/documents/${task.documents[0]?.id}/download`,
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error completing task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
