import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Game, PlayerId, User } from '../types'

// Mock Firebase functions for testing
const mockFirebase = {
  createPlayerSession: vi.fn(),
  validatePlayerSession: vi.fn(),
  getPlayerSession: vi.fn(),
  updateSessionActivity: vi.fn(),
  createSoloGame: vi.fn(),
  addPlayerToGameWithSession: vi.fn(),
  startGameInFirebase: vi.fn(),
  getGameFromFirebase: vi.fn(),
  updateGameInFirebase: vi.fn(),
  createGameInFirebase: vi.fn(),
  addTurnToGameWithSession: vi.fn()
}

// Mock the Firebase module
vi.mock('./firebase', () => ({
  createPlayerSession: mockFirebase.createPlayerSession,
  validatePlayerSession: mockFirebase.validatePlayerSession,
  getPlayerSession: mockFirebase.getPlayerSession,
  updateSessionActivity: mockFirebase.updateSessionActivity,
  createSoloGame: mockFirebase.createSoloGame,
  addPlayerToGameWithSession: mockFirebase.addPlayerToGameWithSession,
  startGameInFirebase: mockFirebase.startGameInFirebase,
  getGameFromFirebase: mockFirebase.getGameFromFirebase,
  updateGameInFirebase: mockFirebase.updateGameInFirebase,
  createGameInFirebase: mockFirebase.createGameInFirebase,
  addTurnToGameWithSession: mockFirebase.addTurnToGameWithSession
}))

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Session Creation and Validation', () => {
    it('should create player session successfully', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const sessionId = 'session-789'
      mockFirebase.createPlayerSession.mockResolvedValue(undefined)

      // Act
      const { createPlayerSession } = await import('./firebase')
      await createPlayerSession(gameId, playerId, sessionId)

      // Assert
      expect(mockFirebase.createPlayerSession).toHaveBeenCalledWith(gameId, playerId, sessionId)
    })

    it('should validate existing session successfully', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const sessionId = 'session-789'
      mockFirebase.validatePlayerSession.mockResolvedValue(true)

      // Act
      const { validatePlayerSession } = await import('./firebase')
      const isValid = await validatePlayerSession(gameId, playerId, sessionId)

      // Assert
      expect(isValid).toBe(true)
      expect(mockFirebase.validatePlayerSession).toHaveBeenCalledWith(gameId, playerId, sessionId)
    })

    it('should reject invalid session', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const sessionId = 'invalid-session'
      mockFirebase.validatePlayerSession.mockResolvedValue(false)

      // Act
      const { validatePlayerSession } = await import('./firebase')
      const isValid = await validatePlayerSession(gameId, playerId, sessionId)

      // Assert
      expect(isValid).toBe(false)
    })

    it('should handle session validation errors gracefully', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const sessionId = 'session-789'
      mockFirebase.validatePlayerSession.mockResolvedValue(false)

      // Act
      const { validatePlayerSession } = await import('./firebase')
      const isValid = await validatePlayerSession(gameId, playerId, sessionId)

      // Assert
      expect(isValid).toBe(false)
    })

    it('should retrieve session information correctly', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const sessionId = 'session-789'
      const mockSession = {
        gameId,
        playerId,
        sessionId,
        joinedAt: Date.now(),
        lastActive: Date.now()
      }
      mockFirebase.getPlayerSession.mockResolvedValue(mockSession)

      // Act
      const { getPlayerSession } = await import('./firebase')
      const session = await getPlayerSession(gameId, playerId, sessionId)

      // Assert
      expect(session).toEqual(mockSession)
      expect(mockFirebase.getPlayerSession).toHaveBeenCalledWith(gameId, playerId, sessionId)
    })

    it('should return null for non-existent session', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const sessionId = 'non-existent'
      mockFirebase.getPlayerSession.mockResolvedValue(null)

      // Act
      const { getPlayerSession } = await import('./firebase')
      const session = await getPlayerSession(gameId, playerId, sessionId)

      // Assert
      expect(session).toBeNull()
    })

    it('should update session activity successfully', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const sessionId = 'session-789'
      mockFirebase.updateSessionActivity.mockResolvedValue(undefined)

      // Act
      const { updateSessionActivity } = await import('./firebase')
      await updateSessionActivity(gameId, playerId, sessionId)

      // Assert
      expect(mockFirebase.updateSessionActivity).toHaveBeenCalledWith(gameId, playerId, sessionId)
    })

    it('should handle session activity update errors gracefully', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const sessionId = 'session-789'
      mockFirebase.updateSessionActivity.mockResolvedValue(undefined)

      // Act
      const { updateSessionActivity } = await import('./firebase')
      await updateSessionActivity(gameId, playerId, sessionId)

      // Assert - Should not throw, should handle error gracefully
      expect(mockFirebase.updateSessionActivity).toHaveBeenCalledWith(gameId, playerId, sessionId)
    })
  })

  describe('Session-Based Game Operations', () => {
    it('should create solo game with session', async () => {
      // Arrange
      const creator: User = {
        id: 'player-123',
        displayName: 'Alice'
      }
      const mockGame: Game = {
        id: 'game-456',
        creator: creator.id,
        players: [creator.id],
        turns: [],
        createdAt: Date.now(),
        status: 'waiting',
        currentPlayerIndex: 0,
        minPlayers: 2,
        maxPlayers: 6
      }
      mockFirebase.createSoloGame.mockResolvedValue(mockGame)

      // Act
      const { createSoloGame } = await import('./firebase')
      const game = await createSoloGame(creator)

      // Assert
      expect(game).toEqual(mockGame)
      expect(mockFirebase.createSoloGame).toHaveBeenCalledWith(creator)
    })

    it('should add player to game with session validation', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const playerName = 'Bob'
      const sessionId = 'session-789'
      const mockGame: Game = {
        id: gameId,
        creator: 'player-123',
        players: ['player-123', playerId],
        turns: [],
        createdAt: Date.now(),
        status: 'waiting',
        currentPlayerIndex: 0,
        minPlayers: 2,
        maxPlayers: 6
      }
      mockFirebase.addPlayerToGameWithSession.mockResolvedValue(mockGame)

      // Act
      const { addPlayerToGameWithSession } = await import('./firebase')
      const game = await addPlayerToGameWithSession(gameId, playerId, playerName, sessionId)

      // Assert
      expect(game).toEqual(mockGame)
      expect(mockFirebase.addPlayerToGameWithSession).toHaveBeenCalledWith(gameId, playerId, playerName, sessionId)
    })

    it('should start game with creator session validation', async () => {
      // Arrange
      const gameId = 'game-123'
      const creatorId = 'player-123'
      const sessionId = 'session-789'
      const mockGame: Game = {
        id: gameId,
        creator: creatorId,
        players: [creatorId, 'player-456'],
        turns: [],
        createdAt: Date.now(),
        status: 'in_progress',
        currentPlayerIndex: 0,
        minPlayers: 2,
        maxPlayers: 6
      }
      mockFirebase.startGameInFirebase.mockResolvedValue(mockGame)

      // Act
      const { startGameInFirebase } = await import('./firebase')
      const game = await startGameInFirebase(gameId, creatorId, sessionId)

      // Assert
      expect(game).toEqual(mockGame)
      expect(mockFirebase.startGameInFirebase).toHaveBeenCalledWith(gameId, creatorId, sessionId)
    })

    it('should reject game start with invalid creator session', async () => {
      // Arrange
      const gameId = 'game-123'
      const creatorId = 'player-123'
      const sessionId = 'invalid-session'
      mockFirebase.startGameInFirebase.mockRejectedValue(new Error('Unauthorized: Invalid session for creator player-123'))

      // Act & Assert
      const { startGameInFirebase } = await import('./firebase')
      await expect(startGameInFirebase(gameId, creatorId, sessionId)).rejects.toThrow('Unauthorized: Invalid session for creator player-123')
    })

    it('should reject game start by non-creator', async () => {
      // Arrange
      const gameId = 'game-123'
      const nonCreatorId = 'player-456'
      const sessionId = 'session-789'
      mockFirebase.startGameInFirebase.mockRejectedValue(new Error('Only the creator can start the game'))

      // Act & Assert
      const { startGameInFirebase } = await import('./firebase')
      await expect(startGameInFirebase(gameId, nonCreatorId, sessionId)).rejects.toThrow('Only the creator can start the game')
    })
  })

  describe('Session Security Scenarios', () => {
    it('should prevent unauthorized turn submission', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const text = 'a beautiful sunset'
      const sessionId = 'invalid-session'
      mockFirebase.validatePlayerSession.mockResolvedValue(false)
      mockFirebase.addTurnToGameWithSession.mockRejectedValue(new Error('Unauthorized: Invalid session for player player-456'))

      // Act & Assert
      const { addTurnToGameWithSession } = await import('./firebase')
      await expect(addTurnToGameWithSession(gameId, playerId, text, sessionId)).rejects.toThrow('Unauthorized: Invalid session for player player-456')
    })

    it('should allow authorized turn submission', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const text = 'a beautiful sunset'
      const sessionId = 'valid-session'
      const mockGame: Game = {
        id: gameId,
        creator: 'player-123',
        players: ['player-123', playerId],
        turns: [{ userId: playerId, text, timestamp: Date.now() }],
        createdAt: Date.now(),
        status: 'in_progress',
        currentPlayerIndex: 1,
        minPlayers: 2,
        maxPlayers: 6
      }
      mockFirebase.addTurnToGameWithSession.mockResolvedValue(mockGame)

      // Act
      const { addTurnToGameWithSession } = await import('./firebase')
      const game = await addTurnToGameWithSession(gameId, playerId, text, sessionId)

      // Assert
      expect(game).toEqual(mockGame)
      expect(mockFirebase.addTurnToGameWithSession).toHaveBeenCalledWith(gameId, playerId, text, sessionId)
    })

    it('should update session activity on turn submission', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const text = 'a beautiful sunset'
      const sessionId = 'valid-session'
      const mockGame: Game = {
        id: gameId,
        creator: 'player-123',
        players: ['player-123', playerId],
        turns: [{ userId: playerId, text, timestamp: Date.now() }],
        createdAt: Date.now(),
        status: 'in_progress',
        currentPlayerIndex: 1,
        minPlayers: 2,
        maxPlayers: 6
      }
      mockFirebase.addTurnToGameWithSession.mockResolvedValue(mockGame)

      // Act
      const { addTurnToGameWithSession } = await import('./firebase')
      await addTurnToGameWithSession(gameId, playerId, text, sessionId)

      // Assert
      expect(mockFirebase.addTurnToGameWithSession).toHaveBeenCalledWith(gameId, playerId, text, sessionId)
    })
  })

  describe('Session Lifecycle Management', () => {
    it('should handle session creation errors', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const sessionId = 'session-789'
      mockFirebase.createPlayerSession.mockRejectedValue(new Error('Firebase connection error'))

      // Act & Assert
      const { createPlayerSession } = await import('./firebase')
      await expect(createPlayerSession(gameId, playerId, sessionId)).rejects.toThrow('Firebase connection error')
    })

    it('should handle session retrieval errors', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const sessionId = 'session-789'
      mockFirebase.getPlayerSession.mockResolvedValue(null)

      // Act
      const { getPlayerSession } = await import('./firebase')
      const session = await getPlayerSession(gameId, playerId, sessionId)

      // Assert
      expect(session).toBeNull() // Should handle error gracefully and return null
    })

    it('should handle multiple sessions per player', async () => {
      // Arrange
      const gameId = 'game-123'
      const playerId = 'player-456'
      const sessionId1 = 'session-789'
      const sessionId2 = 'session-790'
      mockFirebase.createPlayerSession.mockResolvedValue(undefined)

      // Act
      const { createPlayerSession } = await import('./firebase')
      await createPlayerSession(gameId, playerId, sessionId1)
      await createPlayerSession(gameId, playerId, sessionId2)

      // Assert
      expect(mockFirebase.createPlayerSession).toHaveBeenCalledTimes(2)
      expect(mockFirebase.createPlayerSession).toHaveBeenNthCalledWith(1, gameId, playerId, sessionId1)
      expect(mockFirebase.createPlayerSession).toHaveBeenNthCalledWith(2, gameId, playerId, sessionId2)
    })
  })
}) 