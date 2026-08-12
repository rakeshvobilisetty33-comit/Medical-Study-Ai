import Quiz from '../models/Quiz.js';
import Source from '../models/Source.js';
import { queryLLM } from '../services/aiService.js';

export const generateQuiz = async (req, res) => {
  try {
    const { workspaceId, topic, difficulty = 'medium', numQuestions = 5 } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    // 1. Fetch available texts in this workspace
    const sources = await Source.find({ workspaceId, status: 'ready' });
    
    if (!sources || sources.length === 0) {
      return res.status(400).json({ 
        error: 'No study material found in this workspace. Please upload some notes or documents first.' 
      });
    }

    // Gather some text for context
    const contextText = sources.map(s => s.rawText.substring(0, 3000)).join('\n');

    const systemPrompt = `You are a professional medical school examiner.
Generate exactly ${numQuestions} multiple-choice questions (MCQs) of ${difficulty} difficulty on the topic of "${topic || 'General Medical Concepts'}".
Use standard clinical vignettes or medical facts.

Your response MUST be a valid JSON array of question objects. Do not wrap the JSON in markdown code blocks.
Each question object MUST have the following structure:
{
  "question": "Clear question text or clinical scenario...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The exact option text from the options array that is correct",
  "explanation": "Detailed explanation of why the correct option is right and why other options are incorrect.",
  "difficulty": "${difficulty}",
  "topic": "Subtopic name"
}`;

    const userPrompt = `Context from student files:\n${contextText.substring(0, 8000)}\n\nGenerate ${numQuestions} MCQs.`;

    // 2. Query LLM with JSON mode enabled
    const quizQuestions = await queryLLM(systemPrompt, userPrompt, true);

    // Validate and normalize generated questions
    quizQuestions.forEach((q) => {
      // Ensure options is a valid array of strings
      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        q.options = ['Option A', 'Option B', 'Option C', 'Option D'];
      }
      q.options = q.options.map(opt => String(opt).trim());

      // Normalize correctAnswer
      if (!q.correctAnswer) {
        q.correctAnswer = q.options[0];
      } else {
        const correctStr = String(q.correctAnswer).trim();
        const letterIndex = ['A', 'B', 'C', 'D'].indexOf(correctStr.toUpperCase());
        
        if (letterIndex > -1 && q.options[letterIndex]) {
          q.correctAnswer = q.options[letterIndex];
        } else if (!isNaN(Number(correctStr)) && q.options[parseInt(correctStr, 10)]) {
          q.correctAnswer = q.options[parseInt(correctStr, 10)];
        } else {
          const matched = q.options.find(opt => opt.toLowerCase() === correctStr.toLowerCase());
          if (matched) {
            q.correctAnswer = matched;
          } else {
            console.warn(`MCQ correctAnswer mismatch: "${correctStr}" not found in options. Defaulting to first option.`);
            q.correctAnswer = q.options[0];
          }
        }
      }
    });

    // 3. Save quiz to database
    const newQuiz = new Quiz({
      workspaceId,
      topic: topic || '',
      title: `${topic || 'Practice'} Quiz (${difficulty})`,
      questions: quizQuestions,
      difficulty,
      totalQuestions: quizQuestions.length
    });

    await newQuiz.save();

    return res.status(201).json(newQuiz);

  } catch (error) {
    console.error('Quiz generation error:', error);
    let userMessage = 'An unexpected error occurred while generating the quiz.';
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out') || error.message.includes('Mongo')) {
      userMessage = 'Failed to generate quiz due to a database connection issue. Please try again later.';
    } else if (error.message) {
      userMessage = error.message;
    }
    return res.status(500).json({ error: userMessage });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body; // answers: { [questionId]: selectedOptionText }

    if (!quizId || !answers) {
      return res.status(400).json({ error: 'Quiz ID and answers are required' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    let score = 0;
    const weakTopicsMap = {};
    const strongTopicsMap = {};

    quiz.questions.forEach((q) => {
      const userAnswer = answers[q._id];
      const isCorrect = userAnswer === q.correctAnswer;

      if (isCorrect) {
        score++;
        strongTopicsMap[q.topic || 'General'] = (strongTopicsMap[q.topic || 'General'] || 0) + 1;
      } else {
        weakTopicsMap[q.topic || 'General'] = (weakTopicsMap[q.topic || 'General'] || 0) + 1;
      }
    });

    const accuracy = Math.round((score / quiz.questions.length) * 100);

    quiz.score = score;
    quiz.accuracy = accuracy;
    quiz.weakTopics = Object.keys(weakTopicsMap);
    quiz.strongTopics = Object.keys(strongTopicsMap).filter(t => !weakTopicsMap[t]);
    
    await quiz.save();

    return res.status(200).json({
      score,
      accuracy,
      totalQuestions: quiz.questions.length,
      weakTopics: quiz.weakTopics,
      strongTopics: quiz.strongTopics,
      quiz
    });

  } catch (error) {
    console.error('Quiz submission error:', error);
    return res.status(500).json({ error: `Failed to process quiz submission: ${error.message}` });
  }
};

export const getQuizzes = async (req, res) => {
  try {
    const { workspaceId, topic } = req.query;
    const query = {};
    if (workspaceId) query.workspaceId = workspaceId;
    if (topic) query.topic = topic;
    const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
    return res.status(200).json(quizzes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
