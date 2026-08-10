import Workspace from '../models/Workspace.js';
import Source from '../models/Source.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import StudySession from '../models/StudySession.js';

export const createWorkspace = async (req, res) => {
  try {
    const { title, subject, topic, description, userId } = req.body;
    if (!title || !subject) {
      return res.status(400).json({ error: 'Title and Subject are required' });
    }

    const workspace = new Workspace({
      title,
      subject,
      topic,
      description,
      userId: userId || 'default_user'
    });

    await workspace.save();
    return res.status(201).json(workspace);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getWorkspaces = async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const workspaces = await Workspace.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(workspaces);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getWorkspaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    return res.status(200).json(workspace);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Delete Workspace
    const workspace = await Workspace.findByIdAndDelete(id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // 2. Cascade delete all sources, flashcards, quizzes, study sessions
    await Promise.all([
      Source.deleteMany({ workspaceId: id }),
      Flashcard.deleteMany({ workspaceId: id }),
      Quiz.deleteMany({ workspaceId: id }),
      StudySession.deleteMany({ workspaceId: id })
    ]);

    return res.status(200).json({ message: 'Workspace and all associated contents deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
