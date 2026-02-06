
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('--- START ADVANCED DIAGNOSTIC ---');

    // 1. Test Writing Recipient with signingToken
    console.log('\n1. Testing Recipient Creation with signingToken...');
    try {
        // Need a valid user ID for creator?
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('❌ No user found to be creator. Skipping task creation test.');
        } else {
            console.log(`Found user: ${user.id}`);
            // Create a dummy task
            const task = await prisma.task.create({
                data: {
                    name: 'Debug Task',
                    status: 'pending',
                    type: 'request',
                    creatorId: user.id
                }
            });
            console.log(`Created Debug Task: ${task.id}`);

            // Create Recipient with signingToken
            const recipient = await prisma.recipient.create({
                data: {
                    taskId: task.id,
                    name: 'Debug Recipient',
                    email: 'debug@example.com',
                    signingToken: crypto.randomUUID(),
                    color: '#000000'
                }
            });
            console.log(`✅ Created Recipient with signingToken: ${recipient.id}`);
            console.log(`   Token: ${recipient.signingToken}`);

            // Clean up
            await prisma.task.delete({ where: { id: task.id } });
            console.log('Cleaned up debug task.');
        }
    } catch (e) {
        console.error('❌ Recipient Creation FAILED (likely schema mismatch):', e);
    }

    console.log('\n--- END DIAGNOSTIC ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
