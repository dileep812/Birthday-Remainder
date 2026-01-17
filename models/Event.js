import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  _user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  dateOfEvent: {
    type: Date,
    required: true
  },
  eventType: {
    type: String,
    enum: ['Birthday', 'Anniversary', 'Festival', 'Other'],
    default: 'Birthday'
  },
  notes: {
    type: String,
    default: ''
  },
  isRecurring: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Event', EventSchema);

