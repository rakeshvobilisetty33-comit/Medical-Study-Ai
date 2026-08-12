import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';

// Route Imports
import sourceRoutes from './routes/sourceRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import studyRoutes from './routes/studyRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import visualRoutes from './routes/visualRoutes.js';

// Environment variables loading
dotenv.config();

// Mongoose Connection
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all for MVP testing, can be restricted to React client
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

// Routing
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/visual', visualRoutes);

// Catch 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MedStudy AI Server running on port ${PORT}`);
});
