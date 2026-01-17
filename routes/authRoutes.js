import express from 'express';
import passport from 'passport';

const router = express.Router();

// @route   GET /auth/google
// @desc    Authenticate with Google
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
    
);

// @route   GET /auth/google/callback
// @desc    Google auth callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: process.env.CLIENT_URL || 'http://localhost:5173' }),
   (req, res) => {

        res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
    }
);

// @route   GET /auth/logout
// @desc    Logout user
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
    });
});

// @route   GET /auth/current_user
// @desc    Get current logged in user
router.get('/current_user', (req, res) => {
    res.json(req.user || null);
});

export default router;
