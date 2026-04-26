import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import type { ClientToServerEvents, ServerToClientEvents } from '@stadt-land-fluss/shared';
import { registerHandlers } from './socketHandlers';
import * as gameManager from './gameManager';
import { toGameState } from './gameLogic';

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Serve static client in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = process.env.CLIENT_DIST_PATH ?? path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Middleware: look up the player by stable ID sent in the auth handshake.
// If found, tag the socket so the connection handler can auto-rejoin.
io.use((socket, next) => {
  const { playerId } = socket.handshake.auth as { playerId?: string };
  if (playerId) {
    const found = gameManager.findPlayerByStableId(playerId);
    if (found) {
      socket.data.rejoinPlayerId = playerId;
      socket.data.rejoinRoomCode = found.game.roomCode;
    }
  }
  next();
});

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`);

  // Auto-rejoin: executed before any user-driven events
  const { rejoinPlayerId, rejoinRoomCode } = socket.data as {
    rejoinPlayerId?: string;
    rejoinRoomCode?: string;
  };
  if (rejoinPlayerId && rejoinRoomCode) {
    const result = gameManager.rejoinGame(rejoinRoomCode, rejoinPlayerId, socket.id);
    if (result) {
      const { game, player } = result;
      socket.join(game.roomCode);
      socket.emit('game-rejoined', {
        gameState: toGameState(game),
        myPlayerId: player.id,
      });
      socket.to(game.roomCode).emit('player-joined', {
        players: game.players.map(p => ({
          id: p.id, name: p.name, emoji: p.emoji,
          isAdmin: p.isAdmin, isConnected: p.isConnected,
        })),
      });
      console.log(`[~] ${player.name} rejoined room ${game.roomCode}`);
    }
  }

  registerHandlers(io, socket);
  socket.on('disconnect', () => console.log(`[-] ${socket.id} disconnected`));
});

const PORT = Number(process.env.PORT) || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
