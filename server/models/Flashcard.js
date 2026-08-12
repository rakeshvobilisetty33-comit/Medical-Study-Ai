import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  topic: {
    type: String,
    trim: true,
    default: ''
  },
  deckName: {
    type: String,
    default: 'General'
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['new', 'learning', 'review', 'known'],
    default: 'new'
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  nextReviewDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Flashcard = mongoose.model('Flashcard', flashcardSchema);
export default Flashcard;
