require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'InternLog API Backend',
    version: '1.0.0',
    status: 'operational'
  });
});

// Core API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);

// 404 handler for unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Initialize SQLite database and start server
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`InternLog API Server running on http://localhost:${PORT}`);
      console.log(`Database initialized: SQLite (backend/data/internlog.db)`);
      console.log(`=================================================`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize SQLite database:', err);
    process.exit(1);
  });
