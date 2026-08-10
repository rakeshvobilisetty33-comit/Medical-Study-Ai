import express from 'express';
import { 
  generateRevisionNotes, 
  generateVisualLearning, 
  generateStudyGuide, 
  generateComparison, 
  generateMnemonic, 
  analyzeQuestionPaper, 
  getProgress, 
  updateProgress, 
  createReminder, 
  getReminders, 
  deleteReminder, 
  globalSearch 
} from '../controllers/studyController.js';

const router = express.Router();

// Study material generation helpers
router.post('/revision/generate', generateRevisionNotes);
router.post('/visual/generate', generateVisualLearning);
router.post('/study-guide/generate', generateStudyGuide);
router.post('/comparison/generate', generateComparison);
router.post('/mnemonic/generate', generateMnemonic);
router.post('/question-paper/analyze', analyzeQuestionPaper);

// Study Stats & Dashboard Progress
router.get('/progress', getProgress);
router.post('/progress', updateProgress);

// Study Reminders
router.post('/reminders', createReminder);
router.get('/reminders', getReminders);
router.delete('/reminders/:id', deleteReminder);

// Global Search
router.get('/search', globalSearch);

export default router;
