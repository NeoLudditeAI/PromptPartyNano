import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Game, PlayerId, User } from '../types'
import { createGame, addPlayerToGame, startGame, canStartGame, getPlayerCount } from './game'

// Mock Firebase functions for testing
const mockFirebase = {
  createSoloGame: vi.fn(),
  addPlayerToGameWithSession: vi.fn(),
  startGameInFirebase: vi.fn(),
  createPlayerSession: vi.fn(),
  validatePlayerSession: vi.fn(),
  getPlayerSession: vi.fn(),
  updateSessionActivity: vi.fn(),
  getPlayerInfo: vi.fn(),
  getAllPlayerInfo: vi.fn()
}

// Mock the Firebase module
vi.mock('./firebase', () => ({
  createSoloGame: mockFirebase.createSoloGame,
  addPlayerToGameWithSession: mockFirebase.addPlayerToGameWithSession,
  startGameInFirebase: mockFirebase.startGameInFirebase,
  createPlayerSession: mockFirebase.createPlayerSession,
  validatePlayerSession: mockFirebase.validatePlayerSession,
  getPlayerSession: mockFirebase.getPlayerSession,
  updateSessionActivity: mockFirebase.updateSessionActivity,
  getPlayerInfo: mockFirebase.getPlayerInfo,
  getAllPlayerInfo: mockFirebase.getAllPlayerInfo
}))

describe('Lobby Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Game Status Management', () => {
    it('should create game in waiting status', () => {
      // Arrange
      const creator = 'alice'

      // Act
      const game = createGame(creator)

      // Assert
      expect(game.status).toBe('waiting')
      expect(game.creator).toBe(creator)
      expect(game.players).toEqual([creator])
      expect(game.minPlayers).toBe(2)
      expect(game.maxPlayers).toBe(6)
    })

    it('should allow adding players to waiting game', () => {
      // Arrange
      let game = createGame('alice')

      // Act
      game = addPlayerToGame(game, 'bob')

      // Assert
      expect(game.status).toBe('waiting')
      expect(game.players).toEqual(['alice', 'bob'])
    })

    it('should prevent adding players to started game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      expect(() => addPlayerToGame(game, 'charlie')).toThrow('Cannot add player to game that has already started')
    })

    it('should prevent adding players to completed game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)
      // Complete the game by cycling through all players
      game = { ...game, status: 'completed' }

      // Act & Assert
      expect(() => addPlayerToGame(game, 'charlie')).toThrow('Cannot add player to game that has already started')
    })

    it('should start game when enough players join', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')

      // Act
      const startedGame = startGame(game)

      // Assert
      expect(startedGame.status).toBe('in_progress')
      expect(startedGame.currentPlayerIndex).toBe(0)
    })

    it('should prevent starting game with insufficient players', () => {
      // Arrange
      const game = createGame('alice')

      // Act & Assert
      expect(() => startGame(game)).toThrow('Need at least 2 players to start')
    })

    it('should prevent starting already started game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      expect(() => startGame(game)).toThrow('Game has already started')
    })

    it('should prevent starting completed game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)
      game = { ...game, status: 'completed' }

      // Act & Assert
      expect(() => startGame(game)).toThrow('Game has already started')
    })
  })

  describe('Player Count Management', () => {
    it('should track player count correctly', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')

      // Act
      const playerCount = getPlayerCount(game)

      // Assert
      expect(playerCount.current).toBe(3)
      expect(playerCount.min).toBe(2)
      expect(playerCount.max).toBe(6)
    })

    it('should prevent adding more than max players', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = addPlayerToGame(game, 'david')
      game = addPlayerToGame(game, 'eve')
      game = addPlayerToGame(game, 'frank')

      // Act & Assert
      expect(() => addPlayerToGame(game, 'grace')).toThrow('Game is full (maximum 6 players)')
    })

    it('should prevent adding duplicate players', () => {
      // Arrange
      let game = createGame('alice')

      // Act & Assert
      expect(() => addPlayerToGame(game, 'alice')).toThrow('Player already in game')
    })
  })

  describe('Game Start Validation', () => {
    it('should allow starting game with enough players', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')

      // Act
      const canStart = canStartGame(game)

      // Assert
      expect(canStart).toBe(true)
    })

    it('should prevent starting game with insufficient players', () => {
      // Arrange
      const game = createGame('alice')

      // Act
      const canStart = canStartGame(game)

      // Assert
      expect(canStart).toBe(false)
    })

    it('should prevent starting already started game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act
      const canStart = canStartGame(game)

      // Assert
      expect(canStart).toBe(false)
    })

    it('should prevent starting completed game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)
      game = { ...game, status: 'completed' }

      // Act
      const canStart = canStartGame(game)

      // Assert
      expect(canStart).toBe(false)
    })
  })

  describe('Creator Validation', () => {
    it('should identify creator correctly', () => {
      // Arrange
      const game = createGame('alice')

      // Act & Assert
      expect(game.creator).toBe('alice')
    })

    it('should maintain creator through player additions', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')

      // Act & Assert
      expect(game.creator).toBe('alice')
      expect(game.players).toEqual(['alice', 'bob', 'charlie'])
    })
  })

  describe('Game Lifecycle Transitions', () => {
    it('should transition from waiting to in_progress', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')

      // Act
      const startedGame = startGame(game)

      // Assert
      expect(game.status).toBe('waiting')
      expect(startedGame.status).toBe('in_progress')
    })

    it('should maintain player order through transitions', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')

      // Act
      const startedGame = startGame(game)

      // Assert
      expect(startedGame.players).toEqual(['alice', 'bob', 'charlie'])
      expect(startedGame.currentPlayerIndex).toBe(0)
    })

    it('should preserve game data through transitions', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')

      // Act
      const startedGame = startGame(game)

      // Assert
      expect(startedGame.id).toBe(game.id)
      expect(startedGame.creator).toBe(game.creator)
      expect(startedGame.createdAt).toBe(game.createdAt)
      expect(startedGame.minPlayers).toBe(game.minPlayers)
      expect(startedGame.maxPlayers).toBe(game.maxPlayers)
    })
  })

  describe('Edge Cases', () => {
    it('should handle minimum player requirement', () => {
      // Arrange
      const game = createGame('alice')

      // Act & Assert
      expect(game.minPlayers).toBe(2)
      expect(() => startGame(game)).toThrow('Need at least 2 players to start')
    })

    it('should handle maximum player limit', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = addPlayerToGame(game, 'david')
      game = addPlayerToGame(game, 'eve')
      game = addPlayerToGame(game, 'frank')

      // Act & Assert
      expect(() => addPlayerToGame(game, 'grace')).toThrow('Game is full (maximum 6 players)')
    })

    it('should handle empty player name', () => {
      // Arrange
      const game = createGame('alice')

      // Act & Assert
      expect(game.players).toEqual(['alice'])
      // Empty string is not treated as duplicate, it's a valid player ID
      expect(() => addPlayerToGame(game, '')).not.toThrow()
    })

    it('should handle game with only creator', () => {
      // Arrange
      const game = createGame('alice')

      // Act & Assert
      expect(game.players).toEqual(['alice'])
      expect(game.status).toBe('waiting')
      expect(canStartGame(game)).toBe(false)
    })
  })
}) 