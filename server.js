import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';

import './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import Event from './models/Event.js';
import User from './models/User.js';
import { sendNotification } from './services/emailService.js';

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
        secure: true,       // Required for cross-domain
        sameSite: 'none',   // Required for cross-domain
        httpOnly: true      // Security best practice
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

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
// CRON JOBS
// ============================================

// Pre-notification: 7 PM day before (for tomorrow's events)
cron.schedule('0 19 * * *', async () => {
    console.log('⏰ Running Pre-Notification Cron (7 PM)');
    try {
        const { month, day, year } = getTargetDate(1); // Tomorrow

        const events = await Event.find({ eventMonth: month, eventDay: day });
        const filtered = events.filter(e => e.isRecurring || new Date(e.dateOfEvent).getUTCFullYear() === year);

        for (const event of filtered) {
            const user = await User.findById(event._user);
            if (user && user.email) {
                const { subject, message } = generateEmailContent(event, user);
                await sendNotification(user.email, subject, message);
                console.log(`📧 Pre-notification sent to ${user.email} for ${event.name}`);
            }
        }
    } catch (error) {
        console.error('❌ Pre-Notification Cron Error:', error);
    }
});

// Midnight notification: 12 AM on the day
cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running Midnight Notification Cron (12 AM)');
    try {
        const { month, day, year } = getTargetDate(0); // Today

        const events = await Event.find({ eventMonth: month, eventDay: day });
        const filtered = events.filter(e => e.isRecurring || new Date(e.dateOfEvent).getUTCFullYear() === year);

        for (const event of filtered) {
            const user = await User.findById(event._user);
            if (user && user.email) {
                const { subject, message } = generateEmailContent(event, user);
                await sendNotification(user.email, `🎊 TODAY! ${subject}`, message);
                console.log(`📧 Midnight notification sent to ${user.email} for ${event.name}`);
            }
        }
    } catch (error) {
        console.error('❌ Midnight Cron Error:', error);
    }
});

// Morning reminder: 9 AM on the day
cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running Morning Reminder Cron (9 AM)');
    try {
        const { month, day, year } = getTargetDate(0); // Today

        const events = await Event.find({ eventMonth: month, eventDay: day });
        const filtered = events.filter(e => e.isRecurring || new Date(e.dateOfEvent).getUTCFullYear() === year);

        for (const event of filtered) {
            const user = await User.findById(event._user);
            if (user && user.email) {
                const { subject, message } = generateEmailContent(event, user);
                await sendNotification(user.email, `⏰ Morning Reminder: ${subject}`, message);
                console.log(`📧 Morning reminder sent to ${user.email} for ${event.name}`);
            }
        }
    } catch (error) {
        console.error('❌ Morning Cron Error:', error);
    }
});

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Birthday Reminder API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
