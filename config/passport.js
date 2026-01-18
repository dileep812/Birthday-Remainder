import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// ============================================
// Serialize & Deserialize User
// ============================================

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// ============================================
// Google OAuth Strategy
// ============================================

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    proxy: true,
    passReqToCallback: true
},
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({ googleId: profile.id });

            if (existingUser) {
                console.log(`✅ Existing user logged in: ${existingUser.displayName}`);
                // Mark login type for downstream handlers (e.g., callback route)
                if (req && req.session) req.session.loginType = 'existing';
                return done(null, existingUser);
            }

            // Create new user
            const newUser = await User.create({
                googleId: profile.id,
                displayName: profile.displayName,
                email: profile.emails[0].value,
                image: profile.photos[0].value
            });

            console.log(`🆕 New user created: ${newUser.displayName}`);
            if (req && req.session) req.session.loginType = 'new';
            done(null, newUser);
        } catch (error) {
            console.error('❌ Google Strategy Error:', error);
            done(error, null);
        }
    }
));

export default passport;
