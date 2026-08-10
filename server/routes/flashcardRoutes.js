import express from 'express';
import { 
  generateFlashcards, 
  saveFlashcard, 
  getFlashcards, 
  updateFlashcardStatus, 
  deleteFlashcard 
} from '../controllers/flashcardController.js';

const router = express.Router();

// Generate dynamic AI flashcards
router.post('/generate', generateFlashcards);

// Save manual custom flashcard
router.post('/save', saveFlashcard);

// Fetch list of flashcards
router.get('/', getFlashcards);

// Update status (Spaced Repetition) or ease level
router.patch('/:id', updateFlashcardStatus);

// Delete single flashcard
router.delete('/:id', deleteFlashcard);

export default router;
