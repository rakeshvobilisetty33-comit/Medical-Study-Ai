import Flashcard from '../models/Flashcard.js';
import Source from '../models/Source.js';
import { queryLLM } from '../services/aiService.js';

export const generateFlashcards = async (req, res) => {
  try {
    const { workspaceId, deckName = 'Quick Revision', numCards = 5 } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    // 1. Fetch source text
    const sources = await Source.find({ workspaceId, status: 'ready' });
    let contextText = '';
    
    if (sources && sources.length > 0) {
      contextText = sources.map(s => s.rawText.substring(0, 3000)).join('\n');
    }

    const systemPrompt = `You are a medical school academic tutor.
Generate exactly ${numCards} educational flashcards based on the study text provided.
For each flashcard, create a clear, concise question or prompt for the Front, and a detailed, high-yield explanation for the Back.

Your response MUST be a valid JSON array of flashcard objects. Do not wrap the JSON in markdown code blocks.
Each flashcard object MUST have the following structure:
{
  "question": "Front of the card: Term, definition prompt, or question...",
  "answer": "Back of the card: Explanation, clinical significance, or answer...",
  "difficulty": "easy" | "medium" | "hard"
}`;

    const userPrompt = `Context from student files:\n${contextText.substring(0, 8000)}\n\nGenerate ${numCards} flashcards.`;

    // 2. Query LLM
    const cardDataList = await queryLLM(systemPrompt, userPrompt, true);

    // 3. Map and save to database
    const cardsToInsert = cardDataList.map(card => ({
      workspaceId,
      deckName,
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty || 'medium',
      status: 'new'
    }));

    const savedCards = await Flashcard.insertMany(cardsToInsert);
    return res.status(201).json(savedCards);

  } catch (error) {
    console.error('Flashcard generation error:', error);
    return res.status(500).json({ error: `Failed to generate flashcards: ${error.message}` });
  }
};

export const saveFlashcard = async (req, res) => {
  try {
    const { workspaceId, deckName, question, answer, difficulty } = req.body;

    if (!workspaceId || !question || !answer) {
      return res.status(400).json({ error: 'Workspace ID, question, and answer are required' });
    }

    const newCard = new Flashcard({
      workspaceId,
      deckName: deckName || 'Custom Deck',
      question,
      answer,
      difficulty: difficulty || 'medium'
    });

    await newCard.save();
    return res.status(201).json(newCard);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getFlashcards = async (req, res) => {
  try {
    const { workspaceId, deckName } = req.query;
    const query = {};
    
    if (workspaceId) query.workspaceId = workspaceId;
    if (deckName) query.deckName = deckName;

    const cards = await Flashcard.find(query).sort({ createdAt: -1 });
    return res.status(200).json(cards);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateFlashcardStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, difficulty } = req.body; // status: 'known' | 'review' | etc.

    const card = await Flashcard.findById(id);
    if (!card) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    if (status) {
      card.status = status;
      card.reviewCount += 1;
      
      // Basic spaced repetition logic: set next review date
      let daysToAdd = 1;
      if (status === 'known') daysToAdd = 7;
      if (status === 'review') daysToAdd = 2;
      
      card.nextReviewDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    }
    
    if (difficulty) {
      card.difficulty = difficulty;
    }

    await card.save();
    return res.status(200).json(card);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteFlashcard = async (req, res) => {
  try {
    const { id } = req.params;
    const card = await Flashcard.findByIdAndDelete(id);
    if (!card) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }
    return res.status(200).json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
