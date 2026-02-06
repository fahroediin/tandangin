import nodemailer from 'nodemailer';

// Email configuration - use environment variables in production
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@tandangin.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface RecipientInfo {
    name: string;
    email: string;
}

interface TaskInfo {
    id: string;
    name: string;
    creatorName: string;
}

// Send signing invitation to recipient
export async function sendSigningInvitation(
    recipient: RecipientInfo,
    task: TaskInfo,
    signingToken: string
): Promise<boolean> {
    const signUrl = `${APP_URL}/sign/${signingToken}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Tandangin</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
                <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">
                    You've been invited to sign a document
                </h2>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                    Hi ${recipient.name || 'there'},
                </p>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                    <strong>${task.creatorName}</strong> has requested your signature on:
                </p>
                
                <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
                    <p style="color: #111827; margin: 0; font-weight: 600;">
                        📄 ${task.name}
                    </p>
                </div>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                    Click the button below to review and sign the document:
                </p>
                
                <a href="${signUrl}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 0 0 24px 0;">
                    Review &amp; Sign Document
                </a>
                
                <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                    If you have questions about this document, please contact the sender directly.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    This is an automated message from Tandangin.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
`;

    try {
        await transporter.sendMail({
            from: FROM_EMAIL,
            to: recipient.email,
            subject: `Action Required: Sign "${task.name}"`,
            html,
        });
        return true;
    } catch (error) {
        console.error('Error sending signing invitation:', error);
        return false;
    }
}

// Send reminder to recipient who hasn't signed yet
export async function sendSigningReminder(
    recipient: RecipientInfo,
    task: TaskInfo,
    signingToken: string
): Promise<boolean> {
    const signUrl = `${APP_URL}/sign/${signingToken}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Reminder</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
                <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">
                    Your signature is still needed
                </h2>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                    Hi ${recipient.name || 'there'},
                </p>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                    This is a friendly reminder that <strong>${task.creatorName}</strong> is waiting for your signature on:
                </p>
                
                <div style="background: #fffbeb; border-radius: 8px; padding: 16px; margin: 0 0 24px 0; border: 1px solid #fcd34d;">
                    <p style="color: #92400e; margin: 0; font-weight: 600;">
                        📄 ${task.name}
                    </p>
                </div>
                
                <a href="${signUrl}" style="display: inline-block; background: #f59e0b; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 0 0 24px 0;">
                    Sign Now
                </a>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    This is an automated reminder from Tandangin.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
`;

    try {
        await transporter.sendMail({
            from: FROM_EMAIL,
            to: recipient.email,
            subject: `Reminder: Sign "${task.name}"`,
            html,
        });
        return true;
    } catch (error) {
        console.error('Error sending reminder:', error);
        return false;
    }
}

// Send completion notification to task creator
export async function sendTaskCompletedNotification(
    creator: RecipientInfo,
    task: TaskInfo
): Promise<boolean> {
    const taskUrl = `${APP_URL}/task/${task.id}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">✅ Signing Complete</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
                <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">
                    All signatures collected!
                </h2>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                    Hi ${creator.name || 'there'},
                </p>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                    Great news! All recipients have signed your document:
                </p>
                
                <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin: 0 0 24px 0; border: 1px solid #a7f3d0;">
                    <p style="color: #065f46; margin: 0; font-weight: 600;">
                        📄 ${task.name}
                    </p>
                </div>
                
                <a href="${taskUrl}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 0 0 24px 0;">
                    View Completed Document
                </a>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    This is an automated notification from Tandangin.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
`;

    try {
        await transporter.sendMail({
            from: FROM_EMAIL,
            to: creator.email,
            subject: `✅ Completed: "${task.name}" has been signed`,
            html,
        });
        return true;
    } catch (error) {
        console.error('Error sending completion notification:', error);
        return false;
    }
}
