import cron from 'node-cron';

import { sendMail } from '../config/emailService.js';
import Users from "../models/User.js"
import Events from "../models/Event.js"

// --- 2. Notification Logic ---

/**
 * Filters events based on a specific date (month/day)
 * and sends emails to the associated users.
 */
async function processEventNotifications(targetDate, label) {
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const year = targetDate.getFullYear();

    console.log(`[${label}] 🔍 Scanning for events on M:${month} D:${day}...`);

try {
        // 1. Fetch events matching the day and month
        const events = await Events.find({
            $expr: {
                $and: [
                    { $eq: [{ $month: '$dateOfEvent' }, month] },
                    { $eq: [{ $dayOfMonth: '$dateOfEvent' }, day] }
                ]
            }
        }).populate('_user');

        for (const event of events) {
            if (!event._user || !event._user.email) continue;

            // 2. YEAR CHECK for non-recursive events
            if (!event.isRecurring) {
                const eventYear = new Date(event.dateOfEvent).getFullYear();
                
                // If the years don't match, skip this event
                if (eventYear !== year) {
                    console.log(`⏭️ Skipping non-recurring event "${event.name}" (Year ${eventYear} != ${year})`);
                    continue; 
                }
            }

            // 3. Send Email
            const subject = `⏰ Reminder: ${event.name}'s ${event.eventType}`;

            // Generate the beautiful HTML template
                const htmlBody = getEventTemplate(
                    event._user.displayName, 
                    event.name, 
                    event.eventType, 
                    event.notes
                );

// Send the HTML email
await sendMail(event._user.email, subject, htmlBody);
            console.log(`✅ Sent to ${event._user.email}`);

            // 4. DELETE if non-recursive
            if (!event.isRecurring) {
                await Event.findByIdAndDelete(event._id);
                console.log(`🗑️ Deleted one-time event: ${event.name}`);
            }
        }
    } catch (error) {
        console.error(`❌ [${label}] Error processing notifications:`, error);
    }
}

function getEventTemplate(userName, eventName, eventType, notes) {
  const themes = {
    Birthday: { color: '#FF6B6B', icon: '🎂' },
    Anniversary: { color: '#4D96FF', icon: '💍' },
    Festival: { color: '#FFD93D', icon: '🎉' },
    Other: { color: '#6BCB77', icon: '📅' }
  };

  const theme = themes[eventType] || themes.Other;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
      <div style="background-color: ${theme.color}; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">${theme.icon} ${eventType} Reminder!</h1>
      </div>
      <div style="padding: 20px; color: #333; line-height: 1.6;">
        <p>Hello <strong>${userName}</strong>,</p>
        <p>This is a friendly reminder for an upcoming event:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 5px solid ${theme.color};">
          <h2 style="margin: 0; color: ${theme.color};">${eventName}</h2>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${eventType}</p>
          ${notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>
        <p style="margin-top: 20px;">Don't forget to prepare and wish them well!</p>
      </div>
      <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #777;">
        Sent by Your Birthday Reminder App
      </div>
    </div>
  `;
}

// --- 3. Cron Schedules (IST) ---

// A. At 9:00 PM (21:00) IST -> Filter for TOMORROW's events
cron.schedule('0 21 * * *', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    processEventNotifications(tomorrow, "9 PM Job (Tomorrow's Events)");
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

// B. At 12:00 AM (00:00) IST -> Filter for TODAY's events
cron.schedule('0 0 * * *', () => {
    const today = new Date();
    processEventNotifications(today, "12 AM Job (Today's Events)");
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

// C. At 9:00 AM (09:00) IST -> Filter for TODAY's events
cron.schedule('0 9 * * *', () => {
    const today = new Date();
    processEventNotifications(today, "9 AM Job (Today's Events)");
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

cron.schedule('15 23 * * *', () => {
    const today = new Date();
    processEventNotifications(today, "9 AM Job (Today's Events)");
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});



console.log("🚀 Event Notification Scheduler is active (IST).");