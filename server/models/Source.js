import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  pageNumber: {
    type: Number,
    default: 1
  },
  chunkIndex: {
    type: Number,
    required: true
  },
  metadata: {
    type: Map,
    of: String
  }
});

const sourceSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  pages: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['uploading', 'extracting', 'analyzing', 'preparing', 'ready', 'failed'],
    default: 'uploading'
  },
  rawText: {
    type: String,
    default: ''
  },
  chunks: [chunkSchema],
  error: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Source = mongoose.model('Source', sourceSchema);
export default Source;
