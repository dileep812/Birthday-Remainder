import mongoose from 'mongoose';

const birthdaySchema = new mongoose.Schema({
    _user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    birthMonth: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    birthDay: {
        type: Number,
        required: true,
        min: 1,
        max: 31
    }
}, {
    timestamps: true
});

// Index for efficient birthday queries (now includes user)
birthdaySchema.index({ _user: 1, birthMonth: 1, birthDay: 1 });

export default mongoose.model('Birthday', birthdaySchema);
