import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { 
  uploadSource, 
  getSources, 
  getSourceById, 
  deleteSource, 
  updateSource 
} from '../controllers/sourceController.js';

const router = express.Router();

// Upload a single file or pasted text content
router.post('/upload', upload.single('file'), uploadSource);

// Get list of all sources in a workspace
router.get('/', getSources);

// Get detail of a specific source document
router.get('/:id', getSourceById);

// Delete a source document
router.delete('/:id', deleteSource);

// Update/rename source filename
router.patch('/:id', updateSource);

export default router;
