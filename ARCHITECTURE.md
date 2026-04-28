# Architecture

A real-time multiplayer browser game based on the classic German word game "Stadt Land Fluss" (similar to "Scattergories"). Players fill in categories starting with a random letter, then vote on each other's answers.

Built mobile-first — designed to be played on phones around a table.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + inline styles |
| Backend | Node.js + Express + TypeScript |
| Realtime | Socket.IO v4 |
| Monorepo | npm workspaces |

## Project Structure

```
stadt-land-friends/
├── packages/
│   ├── shared/          # Types, constants and validation shared between client and server
│   ├── server/          # Express + Socket.IO game server
│   └── client/          # React frontend
└── design/              # Original design mockups (reference only)
```

### `packages/shared`

The single source of truth for TypeScript types and game constants used by both server and client. Avoids duplication and keeps both sides in sync.

- `types.ts` — Core interfaces: `Player`, `GameState`, `Category`, `PlayerAnswers`, `Vote`, and all Socket.IO event types
- `constants.ts` — Default categories, letter pool, point values, limits
- `validation.ts` — Pure functions for answer comparison and validation

### `packages/server`

Stateless in-memory game server. All game data lives in a `Map` — no database required for the MVP.

- `index.ts` — Creates the Express app and Socket.IO server, binds to port 3001. Contains a Socket.IO middleware that reads the stable player ID from the auth handshake and automatically rejoins the player to their active game on reconnect.
- `gameManager.ts` — CRUD for active games: create, join, remove players, handle disconnects and admin handover. Each player has a stable UUID (`player.id`) that is independent of the socket ID and persists across reconnections.
- `gameLogic.ts` — Pure game logic: letter selection, timer acceleration, score calculation, state serialization
- `socketHandlers.ts` — Registers all Socket.IO event listeners for a connected socket. Lobby disconnects use a 30-second grace period before removing the player, allowing reconnect.

### `packages/client`

Single-page React app. Navigation between screens is handled by a state machine in `GameContext` (no router needed — the server drives all transitions). The stable player ID received from the server is persisted in `localStorage` and sent back in the Socket.IO auth handshake on every reconnect, enabling automatic session recovery after a phone screen goes off or a brief network interruption.

```
src/
├── context/
│   └── GameContext.tsx   # Socket.IO connection + all game state + screen routing
├── pages/
│   ├── Home.tsx          # Landing screen
│   ├── Create.tsx        # Configure and create a new game room
│   ├── Join.tsx          # Join by room code
│   ├── Lobby.tsx         # Waiting room with QR code and player list
│   ├── Reveal.tsx        # Animated letter reveal before a round
│   ├── Round.tsx         # Active round — input fields and countdown timer
│   ├── Voting.tsx        # Per-category answer review and voting
│   └── Scoreboard.tsx    # Round and final results
└── components/
    ├── Btn.tsx            # Button with variants (primary, ghost, outline, …)
    ├── Card.tsx           # Dark rounded card surface
    ├── Screen.tsx         # Page wrapper with consistent padding and background
    ├── Badge.tsx          # Player display (emoji + name)
    ├── QRCode.tsx         # Static SVG QR code for the room join URL
    └── Toast.tsx          # Error notification overlay
```

## Game Flow

```
Home → Create → Lobby ──┐
Home → Join   → Lobby   │
                         ↓
                       Reveal   (animated letter reveal)
                         ↓
                       Round    (fill in answers, countdown timer)
                         ↓
                       Voting   (review and vote on answers per category)
                         ↓
                       Scoreboard
                         ├── more rounds → Reveal → …
                         └── game over  → Home or Lobby
```

The server is the single source of truth. Clients never transition screens on their own — every screen change is triggered by a Socket.IO event from the server.

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `create-game` | `{ nickname, settings }` | Create a new room |
| `join-game` | `{ roomCode, nickname }` | Join an existing room |
| `update-settings` | `Partial<GameSettings>` | Admin updates categories / timer / rounds |
| `start-game` | — | Admin starts the game (min. 2 players) |
| `submit-answers` | `{ answers }` | Player submits their answers |
| `player-done` | — | Player is done early, accelerates the timer |
| `submit-vote` | `{ targetPlayerId, categoryId, accepted }` | Vote on a player's answer |
| `next-category` | — | Admin advances to the next voting category |
| `next-round` | — | Admin shows scores (from voting) or starts next round (from scoreboard) |
| `play-again` | — | Admin resets the game with the same lobby |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `game-created` | `{ roomCode, gameState, myPlayerId }` | Room created successfully |
| `game-joined` | `{ gameState, myPlayerId }` | Joined a room successfully |
| `game-rejoined` | `{ gameState, myPlayerId }` | Automatically rejoined after reconnect (triggered by auth handshake) |
| `error` | `{ message }` | Something went wrong |
| `player-joined` | `{ players }` | Updated player list |
| `player-left` | `{ players }` | Player removed from lobby (after 30 s disconnect grace period) |
| `settings-updated` | `{ settings }` | Admin changed game settings |
| `round-started` | `{ letter, roundNumber, endTime, gameState }` | Round begins |
| `player-finished` | `{ playerId, newEndTime }` | A player submitted early, timer shortened |
| `round-ended` | `{ answers, gameState }` | Round over, voting begins |
| `vote-update` | `{ votes }` | Live vote state update |
| `category-advanced` | `{ votingCategoryIndex }` | Admin moved to next category |
| `round-scores` | `{ scores, roundScores, gameState }` | Scores after a round |
| `game-over` | `{ finalScores, gameState }` | Final round complete |
| `lobby-reset` | `{ gameState }` | Game reset to lobby for a rematch |

## Scoring

| Result | Points |
|---|---|
| Valid unique answer | 20 |
| Valid answer shared with another player | 10 |
| Empty or rejected by majority vote | 0 |

Answers are compared case-insensitively. A majority vote to reject means more than half of the other players voted ✗.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both server and client in watch mode |
| `npm run dev:server` | Server only |
| `npm run dev:client` | Client only |
| `npm run build` | Build all packages for production |
| `npm start` | Run the production server (after build) |
