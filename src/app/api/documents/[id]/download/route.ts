import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import * as fs from 'fs/promises';

// GET /api/documents/[id]/download - Download document
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const document = await prisma.document.findUnique({
            where: { id: params.id },
            include: {
                task: true,
            },
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Check if user has access to this document
        const hasAccess = document.task.creatorId === session.user.id;
        if (!hasAccess) {
            // Check if user is a recipient
            const recipient = await prisma.recipient.findFirst({
                where: {
                    taskId: document.taskId,
                    email: session.user.email!,
                },
            });
            if (!recipient) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // Read file
        const filePath = document.signedPath || document.storagePath;
        const fileBuffer = await fs.readFile(filePath);

        // Return file as response
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${document.originalName}"`,
                'Cache-Control': 'private, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Error downloading document:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
