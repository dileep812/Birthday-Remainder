import express from 'express';
import Event from '../models/Event.js';

const router = express.Router();

// Auth middleware
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'You must be logged in' });
    }
    next();
};

// Get all events for logged-in user
router.get('/', requireAuth, async (req, res) => {
    try {
        const events = await Event.find({ _user: req.user._id }).sort({ dateOfEvent: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Create new event
router.post('/', requireAuth, async (req, res) => {
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
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { name, dateOfEvent, eventType, notes, isRecurring } = req.body;
        const date = new Date(dateOfEvent);

        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, _user: req.user._id },
            {
                name,
                dateOfEvent: date,
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
router.delete('/:id', requireAuth, async (req, res) => {
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

export default router;
