import express from 'express';
import { generateDiagram, saveDiagramToWorkspace } from '../controllers/visualController.js';

const router = express.Router();

// Generate structured medical diagram
router.post('/diagram', generateDiagram);

// Save diagram to Workspace session
router.post('/save', saveDiagramToWorkspace);

export default router;
