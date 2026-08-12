import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema({
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source'
  },
  sourceName: String,
  pageNumber: Number,
  excerpt: String
});

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  citations: [citationSchema],
  isGeneralKnowledge: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const savedExplanationSchema = new mongoose.Schema({
  type: {
    type: String, // simple, clinical, exam
    required: true
  },
  explanation: {
    type: String,
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

const visualLearningItemSchema = new mongoose.Schema({
  type: {
    type: String, // flowchart, mindmap, etc.
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

const studySessionSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  subject: {
    type: String,
    default: ''
  },
  topic: {
    type: String,
    default: ''
  },
  messages: [messageSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastStudiedAt: {
    type: Date,
    default: Date.now
  },
  totalStudyTime: {
    type: Number, // in minutes
    default: 0
  },
  progress: {
    type: Number, // percentage
    default: 0
  },
  completedSections: [String],
  revisionNotes: {
    type: String,
    default: ''
  },
  savedExplanations: [savedExplanationSchema],
  visualLearning: [visualLearningItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const StudySession = mongoose.model('StudySession', studySessionSchema);
export default StudySession;
