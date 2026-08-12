import Flashcard from '../models/Flashcard.js';
import Source from '../models/Source.js';
import { queryLLM } from '../services/aiService.js';

export const generateFlashcards = async (req, res) => {
  try {
    const { workspaceId, deckName = 'Quick Revision', numCards = 5, topic } = req.body;

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
${topic ? `Generate cards specifically for the topic: "${topic}".` : ''}
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

    // 3. Map generated cards with temporary IDs
    const generatedCards = cardDataList.map((card, idx) => ({
      _id: `temp_${Date.now()}_${idx}`,
      workspaceId,
      topic: topic || '',
      deckName,
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty || 'medium',
      status: 'new',
      reviewCount: 0
    }));

    return res.status(200).json(generatedCards);

  } catch (error) {
    console.error('Flashcard generation error:', error);
    return res.status(500).json({ error: `Failed to generate flashcards: ${error.message}` });
  }
};

export const saveFlashcard = async (req, res) => {
  try {
    const { workspaceId, topic, deckName, question, answer, difficulty, flashcards, questions } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    const cardsList = flashcards || questions;
    if (Array.isArray(cardsList)) {
      if (cardsList.length === 0) {
        return res.status(400).json({ error: 'Flashcards array cannot be empty' });
      }

      const cardsToInsert = cardsList.map(card => {
        if (!card.question || !card.answer) {
          throw new Error('Each flashcard must have a question and an answer');
        }
        return {
          workspaceId,
          topic: topic || card.topic || '',
          deckName: deckName || card.deckName || 'Custom Deck',
          question: card.question,
          answer: card.answer,
          difficulty: card.difficulty || 'medium',
          status: card.status || 'new',
          reviewCount: card.reviewCount || 0
        };
      });

      const savedCards = await Flashcard.insertMany(cardsToInsert);
      return res.status(201).json(savedCards);
    }

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const newCard = new Flashcard({
      workspaceId,
      topic: topic || '',
      deckName: deckName || 'Custom Deck',
      question,
      answer,
      difficulty: difficulty || 'medium'
    });

    await newCard.save();
    return res.status(201).json(newCard);
  } catch (error) {
    console.error('Save flashcards error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getFlashcards = async (req, res) => {
  try {
    const { workspaceId, deckName, topic } = req.query;
    const query = {};
    
    if (workspaceId) query.workspaceId = workspaceId;
    if (deckName) query.deckName = deckName;
    if (topic) query.topic = topic;

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
