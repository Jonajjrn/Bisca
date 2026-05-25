import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const PORT = parseInt(process.env.PORT || '3000', 10);
const app = express();
const httpServer = createServer(app);

// Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(express.json());

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    // Per MVP, permettiamo connessioni senza token (sviluppo)
    // In produzione: next(new Error('Authentication required'));
    socket.data.userId = 'anonymous';
  }
  next();
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
  });

  // Placeholder handlers (da implementare nelle milestone successive)
  socket.on('CREATE_LOBBY', (data) => {
    console.log('CREATE_LOBBY', data);
  });

  socket.on('JOIN_LOBBY', (data) => {
    console.log('JOIN_LOBBY', data);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`BiscaWeb server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export { app, io, httpServer };
