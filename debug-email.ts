
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

async function main() {
    console.log('--- EMAIL SENDING TEST ---');

    // Load env (checking loaded vars not needed if using dotenv/next env loading)

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        }
    });

    const from = process.env.EMAIL_FROM || 'noreply@tandangin.com';
    // Use the SMTP user as recipient for testing self-send
    const to = process.env.SMTP_USER || 'debug@example.com';

    console.log(`Attempting to send email...`);
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);

    try {
        const info = await transporter.sendMail({
            from: from,
            to: to,
            subject: 'Tandangin Debug Email',
            text: 'If you receive this, email sending is WORKING.',
            html: '<p>If you receive this, email sending is <strong>WORKING</strong>.</p>'
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    } catch (error) {
        console.error('❌ Email sending FAILED:', error);
    }
}

main().catch(console.error);
