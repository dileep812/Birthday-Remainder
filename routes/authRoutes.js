import express from 'express';
import passport from 'passport';
import { sendMail } from '../config/emailService.js';

const router = express.Router();

// @route   GET /auth/google
// @desc    Authenticate with Google
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] },(req,res)=>{
        console.log("hello");
    })
);

// @route   GET /auth/google/callback
// @desc    Google auth callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: process.env.CLIENT_URL || 'http://localhost:5173' }),
   async (req, res) => {
        // Fire-and-forget login success email to the signed-in user
        try {
            const to = req?.user?.email;
            const name = req?.user?.displayName || 'there';
            const loginType = req?.session?.loginType || 'unknown';
            if (to) {
                console.log('[Auth] Sign-in success. Preparing email.', { to, name, loginType });
                const subject = 'Sign-in Successful – Birthday Reminder';
                const html = `
                    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#111">
                      <h2 style="margin:0 0 12px">Welcome back, ${name}!</h2>
                      <p>You have successfully signed in to <strong>Birthday Reminder</strong>.</p>
                      <p style="margin:8px 0;color:#555">Login type: <strong>${loginType}</strong></p>
                      <p style="margin:8px 0;color:#555">If this wasn’t you, please update your account security.</p>
                      <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
                      <p style="font-size:12px;color:#888">Time: ${new Date().toLocaleString()}</p>
                    </div>
                `;
                // Do not await; avoid delaying redirect
                sendMail(to, subject, html)
                    .then(() => console.log('[Auth] Login email dispatched.', { to, loginType }))
                    .catch((err) => {
                        console.error('Login success email failed:', err);
                    });
            }
        } catch (err) {
            console.error('Error preparing login success email:', err);
        }

        res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
    }
);

// @route   GET /auth/logout
// @desc    Logout user
router.get('/logout', (req, res) => {
    console.log('[Auth] Logout requested.', { userId: req?.user?._id, email: req?.user?.email });
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        console.log('[Auth] Logout successful. Session cleared.');
        res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
    });
});

// @route   GET /auth/current_user
// @desc    Get current logged in user
router.get('/current_user', (req, res) => {
    res.json(req.user || null);
});

export default router;
