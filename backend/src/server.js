import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerSocketHandlers, getRoomStats } from './handlers/socketHandlers.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const PORT = parseInt(process.env.PORT || '5001', 10);
const corsOriginEnv = process.env.CORS_ORIGIN || 'http://localhost:5173';
const nodeEnv = process.env.NODE_ENV || 'development';

// Parse CORS origins - support comma-separated list or single origin
const corsOrigin = corsOriginEnv.includes(',')
  ? corsOriginEnv.split(',').map(origin => origin.trim())
  : corsOriginEnv;

// Warn if using defaults
if (!process.env.CORS_ORIGIN) {
  console.warn('[Server] Warning: CORS_ORIGIN not set, using default:', corsOrigin);
}

const app = express();
const httpServer = createServer(app);

// Configure CORS for Express
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Configure Socket.IO with enhanced settings
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Connection health monitoring settings
  pingInterval: 25000, // Send ping every 25 seconds
  pingTimeout: 10000, // Wait 10 seconds for pong before considering connection dead
  // Transport configuration
  transports: ['websocket', 'polling'],
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Stats endpoint for monitoring
app.get('/stats', (req, res) => {
  const stats = getRoomStats();
  res.json({
    ...stats,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Register all event handlers for this socket
  registerSocketHandlers(socket, io);

  // Track connection metadata
  socket.data.connectTime = Date.now();
  socket.data.reconnectCount = 0;

  // Log when client successfully connects
  socket.emit('connect_success', {
    socketId: socket.id,
    timestamp: Date.now(),
  });
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  // Log but don't exit - let the process manager handle restarts
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`[Server] GeoQuest backend running on port ${PORT}`);
  console.log(`[Server] CORS origin: ${corsOrigin}`);
  console.log(`[Server] Environment: ${nodeEnv}`);
  console.log(`[Socket.IO] Ping interval: 25000ms`);
  console.log(`[Socket.IO] Ping timeout: 10000ms`);
  console.log(`[Socket.IO] Transports: websocket, polling`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, closing server...');

  // Close Socket.IO connections gracefully
  io.close(() => {
    console.log('[Socket.IO] All connections closed');
  });

  // Close HTTP server
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, closing server...');

  // Close Socket.IO connections gracefully
  io.close(() => {
    console.log('[Socket.IO] All connections closed');
  });

  // Close HTTP server
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});
