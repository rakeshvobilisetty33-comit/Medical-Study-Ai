import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  userId: {
    type: String,
    default: 'default_user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
