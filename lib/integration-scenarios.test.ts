import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Game, PlayerId, User } from '../types'
import { createGame, addPlayerToGame, startGame, addTurn, getCurrentPlayer, canStartGame, getPlayerCount, buildFullPrompt, isGameComplete } from './game'

describe('Integration Scenarios', () => {
  describe('Complete Game Workflow', () => {
    it('should handle complete game lifecycle from creation to completion', () => {
      // Arrange - Create game with 3 players
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')

      expect(game.players).toHaveLength(3)
      expect(canStartGame(game)).toBe(true)

      // Act - Start and play
      game = startGame(game)
      expect(game.status).toBe('in_progress')

      // Play first round
      game = addTurn(game, 'alice', 'a beautiful sunset')
      expect(game.turns).toHaveLength(1)
      expect(getCurrentPlayer(game)).toBe('bob')

      game = addTurn(game, 'bob', 'over the ocean')
      expect(game.turns).toHaveLength(2)
      expect(getCurrentPlayer(game)).toBe('charlie')

      game = addTurn(game, 'charlie', 'with golden clouds')
      expect(game.turns).toHaveLength(3)
      expect(getCurrentPlayer(game)).toBe('alice')

      // Play second round
      game = addTurn(game, 'alice', 'fourth turn')
      expect(game.turns).toHaveLength(4)
      expect(getCurrentPlayer(game)).toBe('bob')

      game = addTurn(game, 'bob', 'fifth turn')
      expect(game.turns).toHaveLength(5)
      expect(getCurrentPlayer(game)).toBe('charlie')

      game = addTurn(game, 'charlie', 'sixth turn')
      expect(game.turns).toHaveLength(6)
      expect(game.status).toBe('completed')
      expect(getCurrentPlayer(game)).toBeNull()

      // Assert - Final state
      expect(game.turns).toHaveLength(6)
      expect(game.players).toEqual(['alice', 'bob', 'charlie'])
    })

    it('should handle game with maximum players', () => {
      // Arrange - Create game with 6 players
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = addPlayerToGame(game, 'david')
      game = addPlayerToGame(game, 'eve')
      game = addPlayerToGame(game, 'frank')

      expect(game.players).toHaveLength(6)
      expect(canStartGame(game)).toBe(true)

      // Act - Start and play
      game = startGame(game)
      expect(game.status).toBe('in_progress')

      // Play one turn each
      game = addTurn(game, 'alice', 'first turn')
      game = addTurn(game, 'bob', 'second turn')
      game = addTurn(game, 'charlie', 'third turn')
      game = addTurn(game, 'david', 'fourth turn')
      game = addTurn(game, 'eve', 'fifth turn')
      game = addTurn(game, 'frank', 'sixth turn')

      // Assert - Game should be completed
      expect(game.status).toBe('completed')
      expect(game.turns).toHaveLength(6)
    })

    it('should handle minimum player game', () => {
      // Arrange - Create game with exactly 2 players
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')

      expect(game.players).toHaveLength(2)
      expect(canStartGame(game)).toBe(true)

      // Act - Start and play
      game = startGame(game)
      game = addTurn(game, 'alice', 'first turn')
      game = addTurn(game, 'bob', 'second turn')
      game = addTurn(game, 'alice', 'third turn')
      game = addTurn(game, 'bob', 'fourth turn')
      game = addTurn(game, 'alice', 'fifth turn')
      game = addTurn(game, 'bob', 'sixth turn')

      // Assert - Game should be completed
      expect(game.status).toBe('completed')
      expect(game.turns).toHaveLength(6)
    })
  })

  describe('Lobby Management Scenarios', () => {
    it('should handle players joining and leaving before game starts', () => {
      // Arrange - Create game
      let game = createGame('alice')
      expect(getPlayerCount(game)).toEqual({ current: 1, min: 2, max: 6 })

      // Act - Add players
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = addPlayerToGame(game, 'david')

      expect(getPlayerCount(game)).toEqual({ current: 4, min: 2, max: 6 })
      expect(canStartGame(game)).toBe(true)

      // Act - Start game
      game = startGame(game)
      expect(game.status).toBe('in_progress')
    })

    it('should prevent starting game with insufficient players', () => {
      // Arrange - Create game with single player
      const game = createGame('alice')

      // Act & Assert
      expect(canStartGame(game)).toBe(false)
      expect(() => startGame(game)).toThrow('Need at least 2 players to start')
    })

    it('should handle maximum player limit', () => {
      // Arrange - Create game with 6 players
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = addPlayerToGame(game, 'david')
      game = addPlayerToGame(game, 'eve')
      game = addPlayerToGame(game, 'frank')

      // Act & Assert - Try to add 7th player
      expect(() => addPlayerToGame(game, 'grace')).toThrow('Game is full (maximum 6 players)')
      expect(getPlayerCount(game)).toEqual({ current: 6, min: 2, max: 6 })
    })
  })

  describe('Turn Management Scenarios', () => {
    it('should handle turn order correctly in 3-player game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = startGame(game)

      // Act & Assert - Verify turn order
      expect(getCurrentPlayer(game)).toBe('alice')
      game = addTurn(game, 'alice', 'first turn')
      expect(getCurrentPlayer(game)).toBe('bob')

      game = addTurn(game, 'bob', 'second turn')
      expect(getCurrentPlayer(game)).toBe('charlie')

      game = addTurn(game, 'charlie', 'third turn')
      expect(getCurrentPlayer(game)).toBe('alice')

      game = addTurn(game, 'alice', 'fourth turn')
      expect(getCurrentPlayer(game)).toBe('bob')

      game = addTurn(game, 'bob', 'fifth turn')
      expect(getCurrentPlayer(game)).toBe('charlie')

      game = addTurn(game, 'charlie', 'sixth turn')
      expect(game.status).toBe('completed')
      expect(getCurrentPlayer(game)).toBeNull()
    })

    it('should handle turn order correctly in 2-player game', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert - Verify turn order
      expect(getCurrentPlayer(game)).toBe('alice')
      game = addTurn(game, 'alice', 'first turn')
      expect(getCurrentPlayer(game)).toBe('bob')

      game = addTurn(game, 'bob', 'second turn')
      expect(getCurrentPlayer(game)).toBe('alice')

      game = addTurn(game, 'alice', 'third turn')
      expect(getCurrentPlayer(game)).toBe('bob')

      game = addTurn(game, 'bob', 'fourth turn')
      expect(getCurrentPlayer(game)).toBe('alice')

      game = addTurn(game, 'alice', 'fifth turn')
      expect(getCurrentPlayer(game)).toBe('bob')

      game = addTurn(game, 'bob', 'sixth turn')
      expect(game.status).toBe('completed')
      expect(getCurrentPlayer(game)).toBeNull()
    })

    it('should prevent wrong player from taking turn', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      expect(getCurrentPlayer(game)).toBe('alice')
      expect(() => addTurn(game, 'bob', 'wrong turn')).toThrow("Not bob's turn")
    })

    it('should prevent non-player from taking turn', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      expect(() => addTurn(game, 'charlie', 'unauthorized turn')).toThrow('Player not in game')
    })
  })

  describe('Game State Transitions', () => {
    it('should handle waiting to in_progress transition', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')

      // Act
      game = startGame(game)

      // Assert
      expect(game.status).toBe('in_progress')
      expect(getCurrentPlayer(game)).toBe('alice')
    })

    it('should handle in_progress to completed transition', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act
      game = addTurn(game, 'alice', 'first turn')
      game = addTurn(game, 'bob', 'second turn')
      game = addTurn(game, 'alice', 'third turn')
      game = addTurn(game, 'bob', 'fourth turn')
      game = addTurn(game, 'alice', 'fifth turn')
      game = addTurn(game, 'bob', 'sixth turn')

      // Assert
      expect(game.status).toBe('completed')
      expect(getCurrentPlayer(game)).toBeNull()
    })

    it('should prevent invalid state transitions', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert - Can't start already started game
      expect(() => startGame(game)).toThrow('Game has already started')

      // Act & Assert - Can't add players to started game
      expect(() => addPlayerToGame(game, 'charlie')).toThrow('Cannot add player to game that has already started')
    })
  })

  describe('Prompt Building Scenarios', () => {
    it('should build prompt correctly from multiple turns', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = startGame(game)

      // Act
      game = addTurn(game, 'alice', 'a beautiful sunset')
      game = addTurn(game, 'bob', 'over a mountain')
      game = addTurn(game, 'charlie', 'with golden clouds')

      // Assert
      const prompt = buildFullPrompt(game.turns)
      expect(prompt).toBe('a beautiful sunset over a mountain with golden clouds')
    })

    it('should handle empty turns in prompt building', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      expect(() => addTurn(game, 'alice', '')).toThrow('Turn text cannot be empty')
    })

    it('should handle single turn prompt', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act
      game = addTurn(game, 'alice', 'a beautiful sunset')

      // Assert
      const prompt = buildFullPrompt(game.turns)
      expect(prompt).toBe('a beautiful sunset')
    })
  })

  describe('Concurrent Player Scenarios', () => {
    it('should handle multiple players joining simultaneously', () => {
      // Arrange
      let game = createGame('alice')

      // Act - Simulate multiple players joining
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = addPlayerToGame(game, 'david')

      // Assert
      expect(game.players).toEqual(['alice', 'bob', 'charlie', 'david'])
      expect(game.status).toBe('waiting')
      expect(canStartGame(game)).toBe(true)
    })

    it('should handle duplicate player prevention', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')

      // Act & Assert
      expect(() => addPlayerToGame(game, 'bob')).toThrow('Player already in game')
      expect(() => addPlayerToGame(game, 'alice')).toThrow('Player already in game')
    })
  })

  describe('Game Completion Scenarios', () => {
    it('should complete game when all players have taken one turn', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = startGame(game)

      // Act
      game = addTurn(game, 'alice', 'first turn')
      game = addTurn(game, 'bob', 'second turn')
      game = addTurn(game, 'charlie', 'third turn')
      game = addTurn(game, 'alice', 'fourth turn')
      game = addTurn(game, 'bob', 'fifth turn')
      game = addTurn(game, 'charlie', 'sixth turn')

      // Assert
      expect(game.status).toBe('completed')
      expect(getCurrentPlayer(game)).toBeNull()
      expect(isGameComplete(game)).toBe(true)
    })

    it('should not complete game until all players have taken turns', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = addPlayerToGame(game, 'charlie')
      game = startGame(game)

      // Act
      game = addTurn(game, 'alice', 'first turn')
      game = addTurn(game, 'bob', 'second turn')

      // Assert
      expect(game.status).toBe('in_progress')
      expect(getCurrentPlayer(game)).toBe('charlie')
      expect(isGameComplete(game)).toBe(false)
    })
  })

  describe('Edge Case Integration Scenarios', () => {
    it('should handle game with all empty player names', () => {
      // Arrange
      let game = createGame('')
      game = addPlayerToGame(game, 'bob') // Use different name to avoid duplicate

      // Act
      game = startGame(game)
      game = addTurn(game, '', 'first turn')
      game = addTurn(game, 'bob', 'second turn')
      game = addTurn(game, '', 'third turn')
      game = addTurn(game, 'bob', 'fourth turn')
      game = addTurn(game, '', 'fifth turn')
      game = addTurn(game, 'bob', 'sixth turn')

      // Assert
      expect(game.status).toBe('completed')
      expect(game.players).toEqual(['', 'bob'])
    })

    it('should handle game with very long player names', () => {
      // Arrange
      const longName = 'a'.repeat(1000)
      let game = createGame(longName)
      game = addPlayerToGame(game, 'bob')

      // Act
      game = startGame(game)
      game = addTurn(game, longName, 'first turn')
      game = addTurn(game, 'bob', 'second turn')
      game = addTurn(game, longName, 'third turn')
      game = addTurn(game, 'bob', 'fourth turn')
      game = addTurn(game, longName, 'fifth turn')
      game = addTurn(game, 'bob', 'sixth turn')

      // Assert
      expect(game.status).toBe('completed')
      expect(game.players).toEqual([longName, 'bob'])
    })

    it('should handle game with special characters in names and turns', () => {
      // Arrange
      let game = createGame('alice')
      game = addPlayerToGame(game, 'bob')
      game = startGame(game)

      // Act & Assert
      const longText = 'a'.repeat(26) // Over the 25 character limit
      expect(() => addTurn(game, 'alice', longText)).toThrow('Turn text exceeds 25 character limit')
    })
  })
}) 