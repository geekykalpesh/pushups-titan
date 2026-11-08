const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const pushupRoutes = require('./routes/pushupRoutes');
const eggRoutes = require('./routes/eggRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pushups', pushupRoutes);
app.use('/api/eggs', eggRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Privacy Policy page
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/privacy-policy.html'));
});

// Root & Healthcheck
app.get('/', (req, res) => {
  res.json({
    name: 'Pushup Titan API (GeekyKalpesh)',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: 'Neon Cloud PostgreSQL. JWT Secured.',
    privacy_policy: '/privacy-policy',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server and initialize PostgreSQL DB
app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 Pushup & Nutrition Server running on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
  await initializeDatabase();
});
