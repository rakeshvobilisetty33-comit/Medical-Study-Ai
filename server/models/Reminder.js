import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'default_user'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  datetime: {
    type: Date,
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Reminder = mongoose.model('Reminder', reminderSchema);
export default Reminder;
