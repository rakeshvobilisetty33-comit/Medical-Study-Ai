import express from 'express';
import { generateQuiz, submitQuiz, getQuizzes } from '../controllers/quizController.js';

const router = express.Router();

// Generate quiz MCQs
router.post('/generate', generateQuiz);

// Submit quiz answers and grade
router.post('/submit', submitQuiz);

// Fetch previous quiz scores
router.get('/', getQuizzes);

export default router;
