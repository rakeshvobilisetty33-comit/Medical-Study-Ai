import express from 'express';
import { handleChat, getChatSession } from '../controllers/chatController.js';

const router = express.Router();

// Post a chat query to MedStudy AI
router.post('/', handleChat);

// Retrieve previous chat session logs
router.get('/:sessionId', getChatSession);

export default router;
