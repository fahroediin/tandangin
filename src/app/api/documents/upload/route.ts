import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAuditAction } from '@/lib/auditService';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// POST /api/documents/upload - Upload document
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const taskId = formData.get('taskId') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads');
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const ext = path.extname(file.name);
        const filename = `${uuidv4()}${ext}`;
        const filepath = path.join(uploadsDir, filename);

        // Write file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Create document record
        const document = await prisma.document.create({
            data: {
                originalName: file.name,
                storagePath: filepath,
                taskId: taskId || undefined,
            },
        });

        // Log audit action if task exists
        if (taskId) {
            await logAuditAction(taskId, 'document_uploaded', session.user.id, {
                documentName: file.name,
                documentId: document.id,
            });
        }

        return NextResponse.json({
            document: {
                id: document.id,
                originalName: document.originalName,
                storagePath: document.storagePath,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Error uploading document:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
