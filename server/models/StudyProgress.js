import mongoose from 'mongoose';

const weeklyTimeSchema = new mongoose.Schema({
  day: { type: String, required: true }, // e.g. "Mon", "Tue"
  minutes: { type: Number, default: 0 }
});

const studyProgressSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'default_user',
    unique: true
  },
  totalStudyTime: {
    type: Number, // in minutes
    default: 0
  },
  topicsStudiedCount: {
    type: Number,
    default: 0
  },
  topicsCompleted: [{
    type: String
  }],
  questionsSolved: {
    type: Number,
    default: 0
  },
  flashcardsReviewed: {
    type: Number,
    default: 0
  },
  averageQuizScore: {
    type: Number,
    default: 0
  },
  dailyStreak: {
    type: Number,
    default: 0
  },
  lastStudyDate: {
    type: Date
  },
  subjectProgress: {
    type: Map,
    of: Number, // subject name -> completion percentage (0 to 100)
    default: {}
  },
  weeklyStudyMinutes: {
    type: [weeklyTimeSchema],
    default: [
      { day: 'Mon', minutes: 0 },
      { day: 'Tue', minutes: 0 },
      { day: 'Wed', minutes: 0 },
      { day: 'Thu', minutes: 0 },
      { day: 'Fri', minutes: 0 },
      { day: 'Sat', minutes: 0 },
      { day: 'Sun', minutes: 0 }
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const StudyProgress = mongoose.model('StudyProgress', studyProgressSchema);
export default StudyProgress;
