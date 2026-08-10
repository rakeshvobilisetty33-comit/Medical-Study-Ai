import Source from '../models/Source.js';
import Workspace from '../models/Workspace.js';
import { extractTextFromFile, chunkDocument } from '../services/documentParser.js';

export const uploadSource = async (req, res) => {
  try {
    const { workspaceId, rawText: pastedText } = req.body;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    let filename = '';
    let type = '';
    let size = 0;
    let rawTextContent = '';
    let pagesCount = 1;

    // 1. Check if it is a file upload
    if (req.file) {
      filename = req.file.originalname;
      type = filename.split('.').pop().toLowerCase();
      size = req.file.size;

      // Extract text from uploaded buffer
      try {
        const parsed = await extractTextFromFile(req.file.buffer, filename, req.file.mimetype);
        rawTextContent = parsed.rawText;
        pagesCount = parsed.pages;
      } catch (err) {
        return res.status(422).json({ error: `Parsing error: ${err.message}` });
      }
    } 
    // 2. Check if it is a URL or pasted text
    else if (pastedText) {
      filename = req.body.filename || `Pasted Text - ${new Date().toLocaleDateString()}`;
      type = 'txt';
      size = Buffer.byteLength(pastedText, 'utf8');
      rawTextContent = pastedText;
      pagesCount = Math.max(1, Math.ceil(pastedText.length / 2000));
    } 
    // 3. Fallback: No content provided
    else {
      return res.status(400).json({ error: 'No file uploaded or text content provided' });
    }

    // 4. Validate limits
    if (size > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds maximum limit of 15MB' });
    }

    if (!rawTextContent || rawTextContent.trim().length === 0) {
      return res.status(422).json({ error: 'Could not extract any readable text content' });
    }

    // 5. Create new Source in database (status: extracting)
    const newSource = new Source({
      workspaceId,
      filename,
      type,
      size,
      pages: pagesCount,
      status: 'extracting',
      rawText: rawTextContent
    });

    await newSource.save();

    // 6. Process chunking in background or synchronously for immediate availability
    try {
      newSource.status = 'analyzing';
      await newSource.save();

      const chunks = chunkDocument(rawTextContent, pagesCount);
      
      newSource.status = 'preparing';
      await newSource.save();

      newSource.chunks = chunks;
      newSource.status = 'ready';
      await newSource.save();

      return res.status(201).json(newSource);
    } catch (chunkErr) {
      newSource.status = 'failed';
      newSource.error = chunkErr.message;
      await newSource.save();
      return res.status(500).json({ error: `Document preparation failed: ${chunkErr.message}` });
    }

  } catch (error) {
    console.error('Source upload error:', error);
    return res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

export const getSources = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID query parameter is required' });
    }

    const sources = await Source.find({ workspaceId }).select('-rawText -chunks');
    return res.status(200).json(sources);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getSourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const source = await Source.findById(id);
    if (!source) {
      return res.status(404).json({ error: 'Source document not found' });
    }
    return res.status(200).json(source);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteSource = async (req, res) => {
  try {
    const { id } = req.params;
    const source = await Source.findByIdAndDelete(id);
    if (!source) {
      return res.status(404).json({ error: 'Source document not found' });
    }
    return res.status(200).json({ message: 'Source deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    const source = await Source.findByIdAndUpdate(id, { filename }, { new: true });
    if (!source) {
      return res.status(404).json({ error: 'Source document not found' });
    }
    return res.status(200).json(source);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
