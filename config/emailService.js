import "dotenv/config"; // This loads the variables from your .env file
import nodemailer from 'nodemailer';

/**
 * Function to send an email using .env credentials
 * @param {string} to - Destination email
 * @param {string} subject - Email subject
 * @param {string} text - Email body
 */
async function sendMail(to, subject, htmlContent){
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Event Reminder" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: htmlContent, // Switched from 'text' to 'html'
  };

  return await transporter.sendMail(mailOptions);
};

export { sendMail }; 