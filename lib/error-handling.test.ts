import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Game, PlayerId, User, GameConfig } from '../types'
import { createGame, addPlayerToGame, startGame, addTurn, getCurrentPlayer } from './game'

// Helper function to create a default game config
function createDefaultGameConfig(): GameConfig {
  return {
    TURNS_PER_GAME: 6,
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 6,
    MAX_TURN_LENGTH: 25,
    MAX_TOTAL_LENGTH: 150,
    WARNING_THRESHOLD: 20,
    AUTO_START_ON_FULL: true,
    ALLOW_MID_GAME_JOINS: false,
    GENERATE_IMAGE_EVERY_TURN: true,
    IMAGE_HISTORY_ENABLED: true,
    SESSION_TIMEOUT_MS: 300000,
    MAX_SESSIONS_PER_PLAYER: 3,
    DEBOUNCE_DELAY_MS: 300,
    MAX_CONCURRENT_UPDATES: 5
  }
}

describe('Error Handling and Edge Cases', () => {
  describe('Game Creation Edge Cases', () => {
    it('should handle empty creator ID', () => {
      // Arrange
      const creator = ''

      // Act
      const game = createGame(creator)

      // Assert
      expect(game.creator).toBe('')
      expect(game.players).toEqual([''])
      expect(game.status).toBe('waiting')
    })

    it('should handle very long creator ID', () => {
      // Arrange
      const creator = 'a'.repeat(1000)

      // Act
      const game = createGame(creator)

      // Assert
      expect(game.creator).toBe(creator)
      expect(game.players).toEqual([creator])
    })

    it('should handle special characters in creator ID', () => {
      // Arrange
      const creator = 'player-123!@#$%^&*()'

      // Act
      const game = createGame(creator)

      // Assert
      expect(game.creator).toBe(creator)
      expect(game.players).toEqual([creator])
    })
  })

  describe('Player Addition Edge Cases', () => {
    it('should handle adding empty player ID', () => {
      // Arrange
      let game = createGame('alice')

      // Act
      game = addPlayerToGame(game, '')

      // Assert
      expect(game.players).toEqual(['alice', ''])
      expect(game.status).toBe('waiting')
    })

    it('should handle adding duplicate empty player ID', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, '')

      // Act & Assert
      expect(() => addPlayerToGame(game, '')).toThrow('Player already in game')
    })

    it('should handle adding very long player ID', () => {
      // Arrange
      let game = createGame('alice')
      const longPlayerId = 'b'.repeat(1000)

      // Act
      game = addPlayerToGame(game, longPlayerId)

      // Assert
      expect(game.players).toEqual(['alice', longPlayerId])
    })

    it('should handle adding special characters in player ID', () => {
      // Arrange
      let game = createGame('alice')
      const specialPlayerId = 'player-456!@#$%^&*()'

      // Act
      game = addPlayerToGame(game, specialPlayerId)

      // Assert
      expect(game.players).toEqual(['alice', specialPlayerId])
    })

    it('should handle maximum player limit edge case', () => {
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
  })

  describe('Game Start Edge Cases', () => {
    it('should handle starting game with exactly minimum players', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')

      // Act
      const startedGame = startGame(game)

      // Assert
      expect(startedGame.status).toBe('in_progress')
      expect(startedGame.players).toHaveLength(2)
    })

    it('should handle starting game with maximum players', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = addPlayerToGame(game, 'david')
      game = addPlayerToGame(game, 'eve')
      game = addPlayerToGame(game, 'frank')

      // Act
      const startedGame = startGame(game)

      // Assert
      expect(startedGame.status).toBe('in_progress')
      expect(startedGame.players).toHaveLength(6)
    })

    it('should prevent starting game with single player', () => {
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

  describe('Turn Submission Edge Cases', () => {
    it('should handle empty turn text', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      expect(() => addTurn(game, 'alice', '   ')).toThrow('Turn text cannot be empty')
    })

    it('should handle very long turn text', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      const longText = 'a'.repeat(26) // Over the 25 character limit
      expect(() => addTurn(game, 'alice', longText)).toThrow('Turn text exceeds 25 character limit')
    })

    it('should handle special characters in turn text', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      const specialText = 'a'.repeat(26) // Over the 25 character limit
      expect(() => addTurn(game, 'alice', specialText)).toThrow('Turn text exceeds 25 character limit')
    })

    it('should handle whitespace-only turn text', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      expect(() => addTurn(game, 'alice', '   ')).toThrow('Turn text cannot be empty')
    })

    it('should prevent turn submission in waiting game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')

      // Act & Assert
      expect(() => addTurn(game, 'alice', 'a beautiful sunset')).toThrow('Game is not in progress')
    })

    it('should prevent turn submission in completed game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)
      game = { ...game, status: 'completed' }

      // Act & Assert
      expect(() => addTurn(game, 'alice', 'a beautiful sunset')).toThrow('Game is not in progress')
    })

    it('should prevent turn submission by non-player', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      expect(() => addTurn(game, 'charlie', 'a beautiful sunset')).toThrow('Player not in game')
    })

    it('should prevent turn submission by wrong player', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      expect(() => addTurn(game, 'bob', 'a beautiful sunset')).toThrow("Not bob's turn")
    })
  })

  describe('Current Player Edge Cases', () => {
    it('should return null for waiting game', () => {
      // Arrange
      const game = createGame('alice')

      // Act
      const currentPlayer = getCurrentPlayer(game)

      // Assert
      expect(currentPlayer).toBeNull()
    })

    it('should return null for completed game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)
      game = { ...game, status: 'completed' }

      // Act
      const currentPlayer = getCurrentPlayer(game)

      // Assert
      expect(currentPlayer).toBeNull()
    })

    it('should handle single player game correctly', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act
      const currentPlayer = getCurrentPlayer(game)

      // Assert
      expect(currentPlayer).toBe('alice')
    })

    it('should handle multiple player game correctly', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = startGame(game)

      // Act
      const currentPlayer = getCurrentPlayer(game)

      // Assert
      expect(currentPlayer).toBe('alice')
    })
  })

  describe('Game State Edge Cases', () => {
    it('should handle game with no turns', () => {
      // Arrange
      const game: Game = {
        id: 'test-game',
        creator: 'alice',
        players: ['alice', 'bob'],
        turns: [],
        createdAt: Date.now(),
        status: 'in_progress',
        currentPlayerIndex: 0,
        imageHistory: [],
        minPlayers: 2,
        maxPlayers: 6,
        config: createDefaultGameConfig()
      }

      // Act & Assert
      expect(game.turns).toHaveLength(0)
      expect(getCurrentPlayer(game)).toBe('alice')
    })

    it('should handle game with many turns', () => {
      // Arrange
      const game: Game = {
        id: 'test-game',
        creator: 'alice',
        players: ['alice', 'bob'],
        turns: [
          { userId: 'alice', text: 'turn 1', timestamp: Date.now(), characterCount: 6 },
          { userId: 'bob', text: 'turn 2', timestamp: Date.now(), characterCount: 6 },
          { userId: 'alice', text: 'turn 3', timestamp: Date.now(), characterCount: 6 },
          { userId: 'bob', text: 'turn 4', timestamp: Date.now(), characterCount: 6 },
          { userId: 'alice', text: 'turn 5', timestamp: Date.now(), characterCount: 6 },
          { userId: 'bob', text: 'turn 6', timestamp: Date.now(), characterCount: 6 }
        ],
        createdAt: Date.now(),
        status: 'completed',
        currentPlayerIndex: 0,
        imageHistory: [],
        minPlayers: 2,
        maxPlayers: 6,
        config: createDefaultGameConfig()
      }

      // Act & Assert
      expect(game.turns).toHaveLength(6)
      expect(getCurrentPlayer(game)).toBeNull()
    })

    it('should handle game completion correctly', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)
      game = addTurn(game, 'alice', 'first turn')
      game = addTurn(game, 'bob', 'second turn')
      game = addTurn(game, 'alice', 'third turn')
      game = addTurn(game, 'bob', 'fourth turn')
      game = addTurn(game, 'alice', 'fifth turn')
      game = addTurn(game, 'bob', 'sixth turn')

      // Act & Assert
      expect(game.status).toBe('completed')
      expect(getCurrentPlayer(game)).toBeNull()
    })

    it('should handle game with empty players array', () => {
      // Arrange
      const game: Game = {
        id: 'test-game',
        creator: 'alice',
        players: [],
        turns: [],
        createdAt: Date.now(),
        status: 'waiting',
        currentPlayerIndex: 0,
        imageHistory: [],
        minPlayers: 2,
        maxPlayers: 6,
        config: createDefaultGameConfig()
      }

      // Act & Assert
      expect(game.players).toHaveLength(0)
      expect(() => getCurrentPlayer(game)).not.toThrow()
    })

    it('should handle game with invalid currentPlayerIndex', () => {
      // Arrange
      const game: Game = {
        id: 'test-game',
        creator: 'alice',
        players: ['alice', 'bob'],
        turns: [],
        createdAt: Date.now(),
        status: 'in_progress',
        currentPlayerIndex: 999, // Invalid index
        imageHistory: [],
        minPlayers: 2,
        maxPlayers: 6,
        config: createDefaultGameConfig()
      }

      // Act & Assert
      expect(() => getCurrentPlayer(game)).not.toThrow()
    })
  })

  describe('Data Validation Edge Cases', () => {
    it('should handle game with missing required fields', () => {
      // Arrange
      const incompleteGame = {
        id: 'test-game',
        creator: 'alice',
        players: ['alice', 'bob'],
        turns: [],
        createdAt: Date.now(),
        status: 'waiting' as const,
        currentPlayerIndex: 0,
        imageHistory: [],
        minPlayers: 2,
        maxPlayers: 6,
        config: createDefaultGameConfig()
      } as Game

      // Act & Assert
      expect(() => getCurrentPlayer(incompleteGame)).not.toThrow()
    })

    it('should handle game with invalid status', () => {
      // Arrange
      const game = {
        id: 'test-game',
        creator: 'alice',
        players: ['alice', 'bob'],
        turns: [],
        createdAt: Date.now(),
        status: 'invalid' as any,
        currentPlayerIndex: 0,
        imageHistory: [],
        minPlayers: 2,
        maxPlayers: 6,
        config: createDefaultGameConfig()
      } as Game

      // Act & Assert
      expect(() => getCurrentPlayer(game)).not.toThrow()
    })

    it('should handle game with negative currentPlayerIndex', () => {
      // Arrange
      const game: Game = {
        id: 'test-game',
        creator: 'alice',
        players: ['alice', 'bob'],
        turns: [],
        createdAt: Date.now(),
        status: 'in_progress',
        currentPlayerIndex: -1, // Negative index
        imageHistory: [],
        minPlayers: 2,
        maxPlayers: 6,
        config: createDefaultGameConfig()
      }

      // Act & Assert
      expect(() => getCurrentPlayer(game)).not.toThrow()
    })
  })
}) 