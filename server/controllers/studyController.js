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
    if (!context) {
      return res.status(400).json({ error: 'No source material is available for this workspace. Please upload some study files first.' });
    }

    const systemPrompt = `You are a medical school physiology and pathology professor.
Generate comprehensive, highly structured revision notes for "${topic || 'the selected topic'}".
Use ONLY the provided study materials as your source. Do not invent or extrapolate medical facts, statistics, classifications, or lists that are not supported by the study text.
If the study material does not contain sufficient details for a specific section, state "Sufficient data not available in source materials" rather than writing generic textbook knowledge.
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

// 2. Visual flowchart/mindmap generation (Structured JSON format)
export const generateVisualLearning = async (req, res) => {
  try {
    const { workspaceId, topic, type = 'flowchart' } = req.body;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace ID is required' });

    const context = await getWorkspaceContext(workspaceId);

    const systemPrompt = `You are a medical visual designer and educator.
Generate a structured JSON object representing a ${type} for the topic "${topic}".
Only include information directly supported by the student's study material. Do not extrapolate beyond the source text context.

The response MUST be a valid JSON object matching this schema:
{
  "type": "${type}",
  "title": "Clear central topic title",
  "nodes": [
    {
      "id": "A unique short string ID (e.g. '1', '2', '3' or node name)",
      "label": "Concise node title (maximum 3-5 words)",
      "description": "Short explanation or clinical context"
    }
  ],
  "edges": [
    {
      "source": "ID of the source node",
      "target": "ID of the target node",
      "label": "Optional label describing the relationship/cause (e.g. 'triggers', 'leads to')"
    }
  ]
}`;

    const userPrompt = `Context from materials:\n${context}\n\nGenerate visual ${type} structure for: ${topic}`;
    const result = await queryLLM(systemPrompt, userPrompt, true);

    // Validate response structure (Response validation layer)
    const data = result || {};
    data.type = data.type || type;
    data.title = data.title || `Visual Pathway: ${topic}`;
    
    if (!Array.isArray(data.nodes)) {
      data.nodes = [];
    }
    
    // Filter duplicates and ensure required fields
    const seenNodeIds = new Set();
    data.nodes = data.nodes.filter((node) => {
      if (!node || !node.id || !node.label) return false;
      node.id = String(node.id).trim();
      node.label = String(node.label).trim();
      node.description = String(node.description || '').trim();
      if (seenNodeIds.has(node.id)) return false;
      seenNodeIds.add(node.id);
      return true;
    });

    if (!Array.isArray(data.edges)) {
      data.edges = [];
    }

    // Validate edges point to existing nodes
    data.edges = data.edges.filter((edge) => {
      if (!edge || !edge.source || !edge.target) return false;
      edge.source = String(edge.source).trim();
      edge.target = String(edge.target).trim();
      edge.label = String(edge.label || '').trim();
      return seenNodeIds.has(edge.source) && seenNodeIds.has(edge.target);
    });

    return res.status(200).json(data);
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

    // Fetch all ready sources for this workspace
    const sources = await Source.find({ workspaceId, status: 'ready' });
    if (!sources || sources.length === 0) {
      return res.status(400).json({ error: 'No source material is available for this workspace.' });
    }

    let docText = '';
    let selectedFilename = '';

    if (sourceId) {
      const src = await Source.findById(sourceId);
      if (src) {
        docText = src.rawText;
        selectedFilename = src.filename;
      }
    } else {
      // Find sources matching past paper keywords in filename
      const pastPaperSources = sources.filter(s => 
        /paper|exam|test|past|quiz|question|trend/i.test(s.filename)
      );

      if (pastPaperSources.length > 0) {
        docText = pastPaperSources.map(s => `[Past Paper: ${s.filename}]\n${s.rawText.substring(0, 4000)}`).join('\n\n');
        selectedFilename = pastPaperSources.map(s => s.filename).join(', ');
      }
    }

    // If no past paper files are found, show a clear unverified warning state
    if (!docText) {
      return res.status(200).json({
        markdown: `### Past Paper Analysis
> [!WARNING]
> No verified past-paper dataset is available for this workspace. Upload past-paper material to generate verified trends.`
      });
    }

    const systemPrompt = `You are a medical school exam coordinator analyzing past exam papers.
Review the exam text provided and generate a pattern analysis report.
Do not invent or fabricate exam statistics, percentages, years, question counts, or historical trends.
Distinguish clearly between facts present in the text (SOURCE FACTS) and your general exam prep advice (MODEL INFERENCE).
If the text does not contain enough concrete question patterns to extract frequencies, explain this limitation in the report rather than inventing metrics.

Format your response as Markdown containing:
1. **Frequently Asked Topics**: List the recurring topics, questions, or themes found in the provided past paper content, with frequencies.
2. **High-Yield Core Chapters**: Group the questions into subject chapters (Anatomy, Pharmacology, etc.) and highlight major trends.
3. **Priority Study Plan**: Recommend where a student should focus their efforts based on the actual provided paper content.
4. **Sample Practice Questions**: Recreate 3 typical exam-style questions found in the patterns.`;

    const userPrompt = `Exam text content from [${selectedFilename}]:\n${docText.substring(0, 12000)}\n\nPerform exam pattern analysis.`;
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
    const { workspaceId, subject, topic, datetime, duration, priority, notes } = req.body;
    if (!subject || !topic || !datetime) {
      return res.status(400).json({ error: 'Subject, topic, and datetime are required' });
    }

    const reminder = new Reminder({
      userId: req.body.userId || 'default_user',
      workspaceId: workspaceId || null,
      subject,
      topic,
      datetime: new Date(datetime),
      duration: duration || 60,
      priority: priority || 'medium',
      notes: notes || '',
      completed: false
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

export const updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, active, datetime, topic, subject, notes, duration, priority } = req.body;
    
    const reminder = await Reminder.findById(id);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

    if (completed !== undefined) reminder.completed = completed;
    if (active !== undefined) reminder.active = active;
    if (datetime !== undefined) reminder.datetime = new Date(datetime);
    if (topic !== undefined) reminder.topic = topic;
    if (subject !== undefined) reminder.subject = subject;
    if (notes !== undefined) reminder.notes = notes;
    if (duration !== undefined) reminder.duration = duration;
    if (priority !== undefined) reminder.priority = priority;

    await reminder.save();
    return res.status(200).json(reminder);
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

export const generateFocusTopic = async (req, res) => {
  try {
    const { workspaceId, topic } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Focus topic is required' });
    }

    const trimmedTopic = topic.trim().substring(0, 100);

    // 1. Retrieve workspace sources using direct overrides (fail fast)
    const sources = await Source.find({ workspaceId, status: 'ready' });
    if (!sources || sources.length === 0) {
      return res.status(400).json({ 
        error: 'No study material found in this workspace. Please upload some notes or documents first.' 
      });
    }

    const context = sources.map(s => `[Source: ${s.filename}]\n${s.rawText.substring(0, 5000)}`).join('\n\n');

    const systemPrompt = `You are an expert medical educator.
Analyze the provided study material and generate a comprehensive study sheet for the following focus topic: "${trimmedTopic}".
Only include information directly supported by the student's study material. Do not extrapolate beyond the source text context.

Format your response in Markdown containing exactly these headers:
# Focus Topic: ${trimmedTopic}

## Overview
A concise medical overview of the focus topic.

## Key Concepts
High-yield conceptual breakdown of this topic.

## Important Facts
Core physiological/pathological facts from the text.

## High-Yield Points
Essential exam relevance and testable details.

## Relevant Explanations
Explanations of mechanics and pathways as documented.

## Common Mistakes & Confusions
Clarify potential misunderstandings or diagnostic mixups.

## Important Terms
Definitions of key medical jargon and vocab from the text.

## Suggested Revision Points
Topics or files to check next for reinforcement.`;

    const userPrompt = `Student study material:\n${context.substring(0, 12000)}\n\nGenerate focus topic study sheet for: ${trimmedTopic}`;

    // 2. Query LLM
    const result = await queryLLM(systemPrompt, userPrompt, false);

    return res.status(200).json({ markdown: result });

  } catch (error) {
    console.error('Focus topic generation error:', error);
    let userMessage = 'Unable to load your study material. Please check your connection or try again.';
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out') || error.message.includes('Mongo')) {
      userMessage = 'Failed to load study material due to a database connection issue. Please try again later.';
    } else if (error.message) {
      userMessage = error.message;
    }
    return res.status(500).json({ error: userMessage });
  }
};

export const getOrCreateStudySession = async (req, res) => {
  try {
    const { workspaceId, topic, subject } = req.body;
    if (!workspaceId || !topic) {
      return res.status(400).json({ error: 'workspaceId and topic are required' });
    }

    let session = await StudySession.findOne({ workspaceId, topic });
    if (!session) {
      session = new StudySession({
        workspaceId,
        topic,
        subject: subject || '',
        messages: [],
        completedSections: [],
        revisionNotes: '',
        savedExplanations: [],
        visualLearning: []
      });
      await session.save();
    }
    return res.status(200).json(session);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      totalStudyTime, 
      progress, 
      completedSections, 
      revisionNotes, 
      savedExplanations, 
      visualLearning, 
      messages 
    } = req.body;

    const session = await StudySession.findById(id);
    if (!session) return res.status(404).json({ error: 'Study session not found' });

    if (totalStudyTime !== undefined) session.totalStudyTime = totalStudyTime;
    if (progress !== undefined) session.progress = progress;
    if (completedSections !== undefined) session.completedSections = completedSections;
    if (revisionNotes !== undefined) session.revisionNotes = revisionNotes;
    if (savedExplanations !== undefined) session.savedExplanations = savedExplanations;
    if (visualLearning !== undefined) session.visualLearning = visualLearning;
    if (messages !== undefined) session.messages = messages;

    session.lastStudiedAt = new Date();
    await session.save();
    
    return res.status(200).json(session);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
