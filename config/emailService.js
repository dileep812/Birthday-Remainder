import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend API with logging and safe fallbacks.
 * @param {string} to - Destination email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - Email HTML body
 */
async function sendMail(to, subject, htmlContent) {
  // Basic validation & env fallbacks
  if (!to) {
    console.warn("[Email] Skipping send: missing recipient 'to'.", { subject });
    return { skipped: true, reason: "missing-to" };
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] Skipping send: RESEND_API_KEY not set.");
    return { skipped: true, reason: "missing-api-key" };
  }
  if (!process.env.FROM_EMAIL) {
    console.warn("[Email] Skipping send: FROM_EMAIL not set.");
    return { skipped: true, reason: "missing-from-email" };
  }

  try {
    console.log("[Email] Sending", { to });
    const result = await resend.emails.send({
      from: `Event Reminder <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log("[Email] Sent successfully", { to, id: result?.id });
    return result;
  } catch (err) {
    console.error("[Email] Send failed", { to, subject, error: err });
    throw err;
  }
}

export { sendMail };
