require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { sequelize } = require('./models');
const setupSocket = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());

// API Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) =>
  res.json({ status: 'ok', app: 'Campus Cricket — NIT Srinagar', timestamp: new Date().toISOString() })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Socket.IO
setupSocket(io);

// Start server
const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Database connected successfully');
    server.listen(PORT, () => {
      console.log(`🏏 Campus Cricket — NIT Srinagar API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    // Start server anyway for health check
    server.listen(PORT, () => {
      console.log(`⚠️  Server running on port ${PORT} (DB not connected)`);
    });
  });

module.exports = { app, server, io };
