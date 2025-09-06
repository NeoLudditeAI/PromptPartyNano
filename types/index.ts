// types/index.ts

// --- Utility Types ---

// Unique identifier for a player (same as userId for now)
export type PlayerId = string;

// Unique identifier for a game instance
export type GameId = string;

// Index into the `players[]` array, represents whose turn it is
export type TurnIndex = number;

// --- Game Configuration System ---

// Configuration for game mechanics (easily experimentable)
export const GAME_CONFIG = {
  // Turn Management
  TURNS_PER_GAME: 6,                    // Total turns allowed per game
  MIN_PLAYERS: 2,                        // Minimum players required to start
  MAX_PLAYERS: 6,                        // Maximum players allowed
  
  // Character Limits
  MAX_TURN_LENGTH: 25,                   // Maximum characters per turn
  MAX_TOTAL_LENGTH: 1000,                // Maximum total prompt length
  WARNING_THRESHOLD: 20,                 // Show warning at 80% of limit
  
  // Game Flow
  AUTO_START_ON_FULL: false,             // Auto-start when max players reached
  ALLOW_MID_GAME_JOINS: false,           // Allow players to join after start
  
  // Image Generation
  GENERATE_IMAGE_EVERY_TURN: true,       // Generate image after each turn
  IMAGE_HISTORY_ENABLED: true,           // Store all generated images
  
  // Session Management
  SESSION_TIMEOUT_MS: 30 * 60 * 1000,   // 30 minutes session timeout
  MAX_SESSIONS_PER_PLAYER: 1,            // Max sessions per player per game
  
  // Performance
  DEBOUNCE_DELAY_MS: 500,                // Debounce Firebase updates
  MAX_CONCURRENT_UPDATES: 3,             // Max concurrent Firebase updates
} as const;

// Game configuration type for type safety - more flexible than typeof GAME_CONFIG
export interface GameConfig {
  // Turn Management
  TURNS_PER_GAME: number;
  MIN_PLAYERS: number;
  MAX_PLAYERS: number;
  
  // Character Limits
  MAX_TURN_LENGTH: number;
  MAX_TOTAL_LENGTH: number;
  WARNING_THRESHOLD: number;
  
  // Game Flow
  AUTO_START_ON_FULL: boolean;
  ALLOW_MID_GAME_JOINS: boolean;
  
  // Image Generation
  GENERATE_IMAGE_EVERY_TURN: boolean;
  IMAGE_HISTORY_ENABLED: boolean;
  
  // Session Management
  SESSION_TIMEOUT_MS: number;
  MAX_SESSIONS_PER_PLAYER: number;
  
  // Performance
  DEBOUNCE_DELAY_MS: number;
  MAX_CONCURRENT_UPDATES: number;
}

// Character count status for UI feedback
export type CharacterCountStatus = 'safe' | 'warning' | 'danger' | 'exceeded';

// --- Core Game Turn ---

// A single addition to the collaborative prompt, submitted by a player
export type PromptTurn = {
  userId: PlayerId;      // Who made this contribution
  text: string;          // Their added phrase (limited to MAX_TURN_LENGTH)
  timestamp: number;     // Unix ms timestamp when submitted
  characterCount: number; // Number of characters in this turn
};

// --- Game Status Lifecycle ---

// The current phase of the game
export type GameStatus = 'waiting' | 'in_progress' | 'completed';

// --- Game Structure ---

// The primary game object, tracks all state and history
export interface Game {
  id: GameId;                        // Unique identifier
  creator: PlayerId;                 // Who created the game
  players: PlayerId[];               // All players (creator + joiners)
  turns: PromptTurn[];               // Append-only prompt history
  createdAt: number;                 // Epoch ms for creation
  status: 'waiting' | 'in_progress' | 'completed'; // New status for lobby model
  currentPlayerIndex: number;        // Points to next player in `players[]`
  imageHistory: ImageGenerationResult[]; // All generated images in this game
  minPlayers: number;                // From GAME_CONFIG.MIN_PLAYERS
  maxPlayers: number;                // From GAME_CONFIG.MAX_PLAYERS
  config: GameConfig;                // Game configuration (for future flexibility)
  isGenerating?: boolean;            // Optional: true when image is being generated
}

// --- User Structure ---

// Lightweight user profile (can evolve later)
export interface User {
  id: PlayerId;                     // Unique user ID
  displayName: string;             // For social/group UI
  avatarUrl?: string;              // Optional image URL
}

// --- Group of Users ---

// Groups allow shared games with consistent player sets
export type Group = {
  id: string;                       // Unique group ID
  name: string;                     // Display name
  memberIds: PlayerId[];           // Players in this group
  createdAt: number;               // Epoch ms
  activeGameId?: GameId;           // If a game is in progress
};

// --- DALL·E Output Representation ---

// Result from image generation API
export type ImageGenerationResult = {
  prompt: string;                  // Full composed prompt
  imageUrl: string;                // Final image output URL
  createdAt: number;               // Epoch ms for result creation
  id?: string;                     // Unique identifier for reactions (Phase 2+)
  reactions?: {                    // Anonymous reaction counts (Phase 2+)
    [emoji: string]: number;       // "❤️": 3, "😍": 1, "🎨": 7
  };
  reactionUsers?: {                // Track who reacted (prevent duplicates, enable future attribution)
    [emoji: string]: PlayerId[];   // "❤️": ["alice", "bob"], "😍": ["charlie"]
  };
};
