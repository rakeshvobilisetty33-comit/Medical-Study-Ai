import express from 'express';
import { 
  createWorkspace, 
  getWorkspaces, 
  getWorkspaceById, 
  deleteWorkspace 
} from '../controllers/workspaceController.js';

const router = express.Router();

// Create study workspace
router.post('/', createWorkspace);

// Get list of workspaces
router.get('/', getWorkspaces);

// Get specific workspace info
router.get('/:id', getWorkspaceById);

// Delete specific workspace
router.delete('/:id', deleteWorkspace);

export default router;
