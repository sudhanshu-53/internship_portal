// FILE: server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import { Router as authRoutes } from './routes/auth.js';
import { Router as internshipRoutes } from './routes/internships.js';
import { Router as profileRoutes } from './routes/profile.js';
import { Router as recommendationRoutes } from './routes/recommendations.js';
import { Router as applicationRoutes } from './routes/applications.js';
import { Router as bookmarkRoutes } from './routes/bookmarks.js';
import { Router as chatRoutes } from './routes/chat.js';
import { Router as adminRoutes } from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true
}));
app.use(express.json());

// Serve frontend static files from public/
import { join } from 'path';
const publicPath = join(process.cwd(), 'public');
app.use(express.static(publicPath));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AI Internship Backend API' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database
await initializeDatabase();

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Internship Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// SPA fallback: serve index.html for unknown routes (so client-side routing works)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(join(publicPath, 'index.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
