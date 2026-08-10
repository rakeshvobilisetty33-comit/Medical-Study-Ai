import Source from '../models/Source.js';
import Workspace from '../models/Workspace.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import StudySession from '../models/StudySession.js';
import StudyProgress from '../models/StudyProgress.js';
import Reminder from '../models/Reminder.js';
import { queryLLM } from '../services/aiService.js';

// Retrieve context for study workspace
const getWorkspaceContext = async (workspaceId, limit = 5000) => {
  const sources = await Source.find({ workspaceId, status: 'ready' });
  if (!sources || sources.length === 0) return '';
  return sources.map(s => `[Source: ${s.filename}]\n${s.rawText.substring(0, limit)}`).join('\n\n');
};

// 1. Revision notes generation
export const generateRevisionNotes = async (req, res) => {
  try {
    const { workspaceId, topic } = req.body;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace ID is required' });

    const context = await getWorkspaceContext(workspaceId);

    const systemPrompt = `You are a medical school physiology and pathology professor.
Generate comprehensive, highly structured revision notes for "${topic || 'the selected topic'}".
Use standard academic formatting. Use sections with bold titles. Use tables or lists for readability.

Format your response in Markdown containing:
1. **Topic Definition & Overview**
2. **Etiology & Risk Factors**
3. **Pathophysiology Mechanism** (step-by-step)
4. **Clinical Presentations** (symptoms & physical signs)
5. **Diagnostic Investigations** (labs, imaging, biopsy)
6. **Therapeutic Management** (pharmacotherapy, surgery, supportive)
7. **Complications**
8. **High-Yield Exam Points**
9. **Clinical Pearls** (practical tips for wards)
10. **Common Viva/Oral Questions** (with brief sample answers)`;

    const userPrompt = `Context from materials:\n${context}\n\nGenerate revision notes for: ${topic}`;
    const result = await queryLLM(systemPrompt, userPrompt, false);
    return res.status(200).json({ markdown: result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 2. Visual flowchart generation (Mermaid format)
export const generateVisualLearning = async (req, res) => {
  try {
    const { workspaceId, topic } = req.body;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace ID is required' });

    const context = await getWorkspaceContext(workspaceId);

    const systemPrompt = `You are a medical visual designer.
Create a step-by-step process flowchart or mind map in Mermaid.js syntax representing the biological pathway or mechanism for: "${topic}".
Generate ONLY valid Mermaid syntax inside a markdown code block (\`\`\`mermaid ... \`\`\`).
After the Mermaid block, add a clear, step-by-step text description explaining each node of the diagram.

Example structure:
\`\`\`mermaid
graph TD
    A[Initial trigger] --> B[Secondary step]
    B --> C[Final outcome]
\`\`\``;

    const userPrompt = `Context from materials:\n${context}\n\nGenerate visual flowchart for: ${topic}`;
    const result = await queryLLM(systemPrompt, userPrompt, false);
    return res.status(200).json({ markdown: result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 3. Study guide generator
export const generateStudyGuide = async (req, res) => {
  try {
    const { workspaceId, topic } = req.body;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace ID is required' });

    const context = await getWorkspaceContext(workspaceId);

    const systemPrompt = `You are a medical school coordinator.
Generate a structured Medical Study Guide for: "${topic}".
Include:
- **Topic Overview**
- **Learning Objectives** (What the student must master)
- **Core Clinical Concepts**
- **Essential Medical Definitions**
- **Homeostatic Mechanisms**
- **Clinical Correlations** (e.g. diseases linked to this mechanism)
- **High-Yield Practice Points**
- **Common Exam Questions checklist**`;

    const userPrompt = `Context from materials:\n${context}\n\nGenerate study guide for: ${topic}`;
    const result = await queryLLM(systemPrompt, userPrompt, false);
    return res.status(200).json({ markdown: result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 4. Comparison tool
export const generateComparison = async (req, res) => {
  try {
    const { workspaceId, concept1, concept2 } = req.body;
    if (!workspaceId || !concept1 || !concept2) {
      return res.status(400).json({ error: 'Workspace ID, concept1, and concept2 are required' });
    }

    const context = await getWorkspaceContext(workspaceId);

    const systemPrompt = `You are an academic pathology professor.
Generate a side-by-side comparative analysis of: "${concept1}" vs "${concept2}".
Create a clean Markdown table with features in the first column, followed by Concept 1, and Concept 2.
Features should compare: Etiology/Cause, Pathophysiology, Primary Location, Diagnostic criteria, Clinical Signs, Imaging/Microscopy findings, Complications, and Treatment.
After the table, write a summary of diagnostic differentiation clinchers (how a clinician tells them apart in exams or wards).`;

    const userPrompt = `Context from materials:\n${context}\n\nCompare concept "${concept1}" with "${concept2}".`;
    const result = await queryLLM(systemPrompt, userPrompt, false);
    return res.status(200).json({ markdown: result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 5. Mnemonic generator
export const generateMnemonic = async (req, res) => {
  try {
    const { workspaceId, topic } = req.body;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace ID is required' });

    const context = await getWorkspaceContext(workspaceId);

    const systemPrompt = `You are a medical study skills coach.
Create an easy-to-remember, highly educational mnemonic for "${topic}".
The mnemonic must spell out a relevant word.
Provide:
1. The mnemonic word in bold.
2. An breakdown of what each letter stands for.
3. Detailed physiological/clinical explanation for each point.
4. An exam trick or advice for memorization.`;

    const userPrompt = `Context from materials:\n${context}\n\nGenerate mnemonic for: ${topic}`;
    const result = await queryLLM(systemPrompt, userPrompt, false);
    return res.status(200).json({ markdown: result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 6. Question paper pattern analysis
export const analyzeQuestionPaper = async (req, res) => {
  try {
    const { workspaceId, sourceId } = req.body;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace ID is required' });

    let docText = '';
    if (sourceId) {
      const src = await Source.findById(sourceId);
      if (src) docText = src.rawText;
    } else {
      docText = await getWorkspaceContext(workspaceId, 8000);
    }

    if (!docText) {
      return res.status(400).json({ error: 'No question paper text found. Please upload a past paper first.' });
    }

    const systemPrompt = `You are a medical school exam coordinator analyzing past exam papers.
Review the exam text provided and generate a pattern analysis report.
Format as Markdown containing:
1. **Frequently Asked Topics**: List the recurring topics, questions, or themes, with estimated frequencies.
2. **High-Yield Core Chapters**: Group the questions into subject chapters (Anatomy, Pharmacology, etc.) and highlight major trends.
3. **Priority Study Plan ('What should I study first?')**: Order the topics chronologically by exam importance, recommending where a student should focus their efforts.
4. **Sample Practice Questions**: Recreate 3 typical exam-style questions found in the patterns.`;

    const userPrompt = `Exam text content:\n${docText.substring(0, 12000)}\n\nPerform exam pattern analysis.`;
    const result = await queryLLM(systemPrompt, userPrompt, false);
    return res.status(200).json({ markdown: result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 7. Study Progress endpoints
export const getProgress = async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    let progress = await StudyProgress.findOne({ userId });
    
    if (!progress) {
      // Create empty stats sheet on first fetch
      progress = new StudyProgress({ userId });
      await progress.save();
    }

    return res.status(200).json(progress);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { 
      userId = 'default_user', 
      studyTimeMinutes = 0, 
      questionsSolved = 0, 
      flashcardsReviewed = 0,
      quizScore = null,
      completedTopic = null,
      subjectName = null,
      subjectProgressPercent = 0
    } = req.body;

    let progress = await StudyProgress.findOne({ userId });
    if (!progress) {
      progress = new StudyProgress({ userId });
    }

    // Update study time
    if (studyTimeMinutes > 0) {
      progress.totalStudyTime += studyTimeMinutes;
      
      // Update weekly distribution based on current day
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = days[new Date().getDay()];
      const dayIndex = progress.weeklyStudyMinutes.findIndex(d => d.day === today);
      if (dayIndex !== -1) {
        progress.weeklyStudyMinutes[dayIndex].minutes += studyTimeMinutes;
      }
    }

    // Update questions solved
    if (questionsSolved > 0) {
      progress.questionsSolved += questionsSolved;
    }

    // Update flashcard count
    if (flashcardsReviewed > 0) {
      progress.flashcardsReviewed += flashcardsReviewed;
    }

    // Update average quiz score
    if (quizScore !== null) {
      const solvedQuizzes = await Quiz.find({ accuracy: { $gt: 0 } });
      const totalAccuracy = solvedQuizzes.reduce((acc, q) => acc + q.accuracy, 0) + quizScore;
      progress.averageQuizScore = Math.round(totalAccuracy / (solvedQuizzes.length + 1));
    }

    // Track completed topics
    if (completedTopic && !progress.topicsCompleted.includes(completedTopic)) {
      progress.topicsCompleted.push(completedTopic);
      progress.topicsStudiedCount = progress.topicsCompleted.length;
    }

    // Track subject completion
    if (subjectName) {
      progress.subjectProgress.set(subjectName, subjectProgressPercent);
    }

    // Update Streak
    const todayStr = new Date().toDateString();
    if (!progress.lastStudyDate) {
      progress.dailyStreak = 1;
    } else {
      const lastDateStr = new Date(progress.lastStudyDate).toDateString();
      if (lastDateStr !== todayStr) {
        const diffTime = Math.abs(new Date(todayStr) - new Date(lastDateStr));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          progress.dailyStreak += 1;
        } else if (diffDays > 1) {
          progress.dailyStreak = 1; // streak broken
        }
      }
    }
    progress.lastStudyDate = new Date();

    await progress.save();
    return res.status(200).json(progress);

  } catch (error) {
    console.error('Update progress error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// 8. Reminders CRUD
export const createReminder = async (req, res) => {
  try {
    const { subject, topic, datetime, message } = req.body;
    if (!subject || !topic || !datetime) {
      return res.status(400).json({ error: 'Subject, topic, and datetime are required' });
    }

    const reminder = new Reminder({
      userId: req.body.userId || 'default_user',
      subject,
      topic,
      datetime: new Date(datetime),
      message
    });

    await reminder.save();
    return res.status(201).json(reminder);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getReminders = async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const reminders = await Reminder.find({ userId }).sort({ datetime: 1 });
    return res.status(200).json(reminders);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findByIdAndDelete(id);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    return res.status(200).json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 9. Global Search endpoint
export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(200).json({ workspaces: [], sources: [], flashcards: [], quizzes: [] });
    }

    const regex = new RegExp(q, 'i');

    const [workspaces, sources, flashcards, quizzes] = await Promise.all([
      Workspace.find({ $or: [{ title: regex }, { subject: regex }, { topic: regex }] }).limit(10),
      Source.find({ filename: regex }).select('filename type workspaceId status').limit(10),
      Flashcard.find({ $or: [{ question: regex }, { answer: regex }] }).limit(10),
      Quiz.find({ title: regex }).limit(10)
    ]);

    return res.status(200).json({
      workspaces,
      sources,
      flashcards,
      quizzes
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
