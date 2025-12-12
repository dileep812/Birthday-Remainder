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
    callbackURL: '/auth/google/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({ googleId: profile.id });

            if (existingUser) {
                console.log(`✅ Existing user logged in: ${existingUser.displayName}`);
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
            done(null, newUser);
        } catch (error) {
            console.error('❌ Google Strategy Error:', error);
            done(error, null);
        }
    }
));

export default passport;
