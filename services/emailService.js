import nodemailer from 'nodemailer';

// Create reusable transporter using SMTP configuration from environment variables
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Sends an email notification.
 * This is a reusable function designed to be called from Cron jobs.
 * 
 * @param {string} email - Recipient's email address
 * @param {string} subject - Email subject line
 * @param {string} message - Email body (plain text or HTML)
 * @param {boolean} [isHtml=false] - Set to true if message contains HTML
 * @returns {Promise<object>} - Nodemailer send result with messageId
 */
export async function sendNotification(email, subject, message, isHtml = false) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: subject,
            [isHtml ? 'html' : 'text']: message
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Email sent to ${email}: ${info.messageId}`);
        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error.message);
        throw error;
    }
}

/**
 * Verifies the email transporter configuration is working.
 * Call this on server startup to catch configuration issues early.
 * 
 * @returns {Promise<boolean>} - True if configuration is valid
 */
export async function verifyEmailConfig() {
    try {
        await transporter.verify();
        console.log('✅ Email service is ready');
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error.message);
        return false;
    }
}

export { transporter };
