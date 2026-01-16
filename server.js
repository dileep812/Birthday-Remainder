import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import Event from './models/Event.js';
import User from './models/User.js';
import { sendNotification, verifyEmailConfig } from './services/emailService.js';

dotenv.config();

const app = express();

// Trust proxy (required for Render/Heroku behind proxy)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Session configuration
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
    secret: process.env.COOKIE_KEY || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: isProduction,              // true in production, false locally
        sameSite: isProduction ? 'none' : 'lax',  // 'none' for cross-domain, 'lax' locally
        httpOnly: true
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Verify email configuration on startup
verifyEmailConfig();

// Auth Routes
app.use('/auth', authRoutes);

// Auth middleware
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'You must be logged in' });
    }
    next();
};

// ============================================
// API ROUTES
// ============================================

// Get all events for logged-in user
app.get('/api/events', requireAuth, async (req, res) => {
    try {
        const events = await Event.find({ _user: req.user._id }).sort({ eventMonth: 1, eventDay: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Create new event
app.post('/api/events', requireAuth, async (req, res) => {
    try {
        const { name, dateOfEvent, eventType, notes, isRecurring } = req.body;
        const date = new Date(dateOfEvent);

        // For non-recurring events, ensure the date is in the future
        if (isRecurring === false) {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const eventDate = new Date(date);
            eventDate.setUTCHours(0, 0, 0, 0);

            if (eventDate < today) {
                return res.status(400).json({ error: 'Non-recurring events cannot have past dates' });
            }
        }

        const event = new Event({
            _user: req.user._id,
            name,
            dateOfEvent: date,
            eventMonth: date.getUTCMonth() + 1,
            eventDay: date.getUTCDate(),
            eventType: eventType || 'Birthday',
            notes: notes || '',
            isRecurring: isRecurring !== undefined ? isRecurring : true
        });

        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Update event
app.put('/api/events/:id', requireAuth, async (req, res) => {
    try {
        const { name, dateOfEvent, eventType, notes, isRecurring } = req.body;
        const date = new Date(dateOfEvent);

        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, _user: req.user._id },
            {
                name,
                dateOfEvent: date,
                eventMonth: date.getUTCMonth() + 1,
                eventDay: date.getUTCDate(),
                eventType,
                notes,
                isRecurring
            },
            { new: true }
        );

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// Delete event
app.delete('/api/events/:id', requireAuth, async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({
            _id: req.params.id,
            _user: req.user._id
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

const getTargetDate = (offsetDays = 0) => {
    const now = new Date();
    const target = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    return {
        month: target.getUTCMonth() + 1,
        day: target.getUTCDate(),
        year: target.getUTCFullYear()
    };
};

const generateEmailContent = (event, user) => {
    const emoji = event.eventType === 'Birthday' ? '🎂' :
        event.eventType === 'Anniversary' ? '💍' :
            event.eventType === 'Festival' ? '🎉' : '📅';

    const subject = `${emoji} ${event.eventType} Reminder: ${event.name}`;

    let message = `<h2>${emoji} ${event.eventType} Reminder</h2>`;
    message += `<p>Hi ${user.displayName},</p>`;
    message += `<p>This is a reminder that <strong>${event.name}'s ${event.eventType}</strong> is coming up!</p>`;

    if (event.notes) {
        message += `<p><strong>Your notes:</strong> ${event.notes}</p>`;
    }

    message += `<p>Don't forget to prepare something special! 🎁</p>`;
    message += `<hr><p style="color: #666; font-size: 12px;">Birthday Reminder App</p>`;

    return { subject, message };
};

// ============================================
// NOTIFICATION LOGIC
// ============================================

const sendNotificationsForDay = async (targetMonth, targetDay, targetYear, messagePrefix = '') => {
    try {
        const events = await Event.find({ eventMonth: targetMonth, eventDay: targetDay });
        
        for (const event of events) {
            const user = await User.findById(event._user);
            if (!user || !user.email) continue;

            const eventYear = new Date(event.dateOfEvent).getUTCFullYear();
            const isRecurring = event.isRecurring === true;
            const isNonRecurring = event.isRecurring === false;

            // For recurring events: always send notification
            // For non-recurring events: only send if the date is today or has not passed yet
            let shouldSend = false;

            if (isRecurring) {
                // Recurring: send every year on this month/day
                shouldSend = true;
            } else if (isNonRecurring) {
                // Non-recurring: only send if today is the event date
                shouldSend = (targetMonth === event.eventMonth && 
                            targetDay === event.eventDay && 
                            targetYear === eventYear);
            }

            if (shouldSend) {
                try {
                    const { subject, message } = generateEmailContent(event, user);
                    await sendNotification(user.email, messagePrefix + subject, message, true);
                    console.log(`📧 ${messagePrefix.trim()} notification sent to ${user.email} for ${event.name}`);

                    // For non-recurring events, delete after sending notifications on the day itself
                    if (isNonRecurring && (targetMonth === event.eventMonth && 
                                          targetDay === event.eventDay && 
                                          targetYear === eventYear)) {
                        // Only delete on the actual day of the event (not during pre-notifications)
                        // This will be handled in the midnight/morning cron jobs
                    }
                } catch (err) {
                    console.error(`❌ Failed to send notification for ${event.name}:`, err.message);
                }
            }
        }
    } catch (error) {
        console.error('❌ Notification Error:', error);
    }
};

// ============================================
// CRON JOBS FOR NOTIFICATIONS (Indian Standard Time - IST/UTC+5:30)
// ============================================

// 1. Previous day at 10 AM IST (4:30 AM UTC)
cron.schedule('30 4 * * *', async () => {
    console.log('⏰ Running Notification Cron - Previous Day 10 AM IST');
    const { month, day, year } = getTargetDate(1); // Tomorrow
    await sendNotificationsForDay(month, day, year, '📧 Reminder: ');
});

// 2. Previous day at 9 PM IST (3:30 PM UTC)
cron.schedule('30 15 * * *', async () => {
    console.log('⏰ Running Notification Cron - Previous Day 9 PM IST');
    const { month, day, year } = getTargetDate(1); // Tomorrow
    await sendNotificationsForDay(month, day, year, '🔔 Last Minute: ');
});

// 3. At 12 AM (Midnight) IST on the day (6:30 PM UTC previous day)
cron.schedule('30 18 * * *', async () => {
    console.log('⏰ Running Notification Cron - Midnight (12 AM) IST');
    const { month, day, year } = getTargetDate(1); // Tomorrow (since this fires at 6:30 PM UTC, which is midnight IST tomorrow)
    await sendNotificationsForDay(month, day, year, '🎊 TODAY! ');
});

// 4. At 10 AM IST on the day (4:30 AM UTC)
cron.schedule('30 4 * * *', async () => {
    console.log('⏰ Running Notification Cron - Day 10 AM IST');
    const { month, day, year } = getTargetDate(0); // Today
    await sendNotificationsForDay(month, day, year, '⏰ Morning Reminder: ');

    // Delete non-recurring events after morning notification on the event day
    try {
        const allEvents = await Event.find({ eventMonth: month, eventDay: day });
        for (const event of allEvents) {
            const eventYear = new Date(event.dateOfEvent).getUTCFullYear();
            if (event.isRecurring === false && eventYear === year) {
                await Event.findByIdAndDelete(event._id);
                console.log(`🗑️ Non-recurring event deleted: ${event.name}`);
            }
        }
    } catch (error) {
        console.error('❌ Error deleting non-recurring events:', error);
    }
});

// Serve static files from React build in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client', 'dist')));

    // Handle React routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
            res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
        }
    });
} else {
    // Health check for development
    app.get('/', (req, res) => {
        res.json({ message: 'Birthday Reminder API is running' });
    });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
