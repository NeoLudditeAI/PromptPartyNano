// lib/firebase.test.ts
import { describe, it, expect } from 'vitest'
import { 
  createGameInFirebase, 
  getGameFromFirebase, 
  updateGameInFirebase, 
  addTurnToGame, 
  createAndSaveGame,
  getCurrentPlayerFromGame,
  buildPromptFromGame,
  isGameCompleteInFirebase,
  addPlayerToGame,
  setGenerating,
  clearGenerating,
  computeUniqueDisplayName
} from './firebase'
import { PlayerId } from '../types'

// Helper function to check if Firebase is configured
const isFirebaseConfigured = () => {
  return process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL &&
         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
         !process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL.includes('mock-project-id')
}

describe('Firebase Integration', () => {
  describe('createGameInFirebase', () => {
    it('should create and store a game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const { createGame } = await import('./game')
      const game = createGame(players)

      // Act
      await createGameInFirebase(game)

      // Assert
      const retrievedGame = await getGameFromFirebase(game.id)
      expect(retrievedGame).toEqual(game)
    })
  })

  describe('getGameFromFirebase', () => {
    it('should return null for non-existent game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Act
      const game = await getGameFromFirebase('non-existent-id')

      // Assert
      expect(game).toBeNull()
    })

    it('should return the correct game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const { createGame } = await import('./game')
      const game = createGame(players)
      await createGameInFirebase(game)

      // Act
      const retrievedGame = await getGameFromFirebase(game.id)

      // Assert
      expect(retrievedGame).toEqual(game)
    })
  })

  describe('updateGameInFirebase', () => {
    it('should update an existing game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const { createGame } = await import('./game')
      const game = createGame(players)
      await createGameInFirebase(game)

      // Modify the game
      const updatedGame = { ...game, status: 'completed' as const }

      // Act
      await updateGameInFirebase(updatedGame)

      // Assert
      const retrievedGame = await getGameFromFirebase(game.id)
      expect(retrievedGame?.status).toBe('completed')
    })
  })

  describe('addPlayerToGame', () => {
    it('should add a player to an existing game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const game = await createAndSaveGame(players)
      const newPlayerId = 'charlie'
      const newPlayerName = 'Charlie'

      // Act
      const updatedGame = await addPlayerToGame(game.id, newPlayerId, newPlayerName)

      // Assert
      expect(updatedGame.players).toContain(newPlayerId)
      expect(updatedGame.players).toHaveLength(3)
      expect(updatedGame.status).toBe('in_progress')

      // Verify it was saved to Firebase
      const retrievedGame = await getGameFromFirebase(game.id)
      expect(retrievedGame?.players).toContain(newPlayerId)
    })

    it('should throw error for non-existent game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Act & Assert
      await expect(
        addPlayerToGame('non-existent-id', 'charlie', 'Charlie')
      ).rejects.toThrow('Game non-existent-id not found')
    })

    it('should throw error for completed game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const game = await createAndSaveGame(players)
      
      // Complete the game by adding enough turns
      let updatedGame = game
      for (let i = 0; i < 6; i++) {
        updatedGame = await addTurnToGame(updatedGame.id, updatedGame.players[i % 2], `turn ${i}`)
      }

      // Act & Assert
      await expect(
        addPlayerToGame(updatedGame.id, 'charlie', 'Charlie')
      ).rejects.toThrow('Cannot add player to completed game')
    })

    it('should throw error for full game (6 players)', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange - Create a game with 6 players
      const players: PlayerId[] = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6']
      const game = await createAndSaveGame(players)

      // Act & Assert
      await expect(
        addPlayerToGame(game.id, 'player7', 'Player 7')
      ).rejects.toThrow('Game is full (maximum 6 players)')
    })

    it('should throw error for duplicate player', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const game = await createAndSaveGame(players)

      // Act & Assert
      await expect(
        addPlayerToGame(game.id, 'alice', 'Alice')
      ).rejects.toThrow('Player already in game')
    })
  })

  describe('addTurnToGame', () => {
    it('should add a turn and update the game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const { createGame } = await import('./game')
      const game = createGame(players)
      await createGameInFirebase(game)

      // Act
      const updatedGame = await addTurnToGame(game.id, 'alice', 'a beautiful sunset')

      // Assert
      expect(updatedGame.turns).toHaveLength(1)
      expect(updatedGame.turns[0]).toEqual({
        userId: 'alice',
        text: 'a beautiful sunset',
        timestamp: expect.any(Number)
      })
      expect(updatedGame.currentPlayerIndex).toBe(1) // Should be bob's turn now
    })

    it('should throw error if game not found', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Act & Assert
      await expect(
        addTurnToGame('non-existent-id', 'alice', 'a beautiful sunset')
      ).rejects.toThrow('Game non-existent-id not found')
    })

    it('should throw error if wrong player tries to take turn', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const { createGame } = await import('./game')
      const game = createGame(players)
      await createGameInFirebase(game)

      // Act & Assert
      await expect(
        addTurnToGame(game.id, 'bob', 'a beautiful sunset')
      ).rejects.toThrow("It's not bob's turn. Current player is alice")
    })
  })

  describe('createAndSaveGame', () => {
    it('should create and save a new game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob', 'charlie']

      // Act
      const game = await createAndSaveGame(players)

      // Assert
      expect(game.players).toEqual(players)
      expect(game.turns).toEqual([])
      expect(game.currentPlayerIndex).toBe(0)
      expect(game.status).toBe('in_progress')

      // Verify it was saved
      const retrievedGame = await getGameFromFirebase(game.id)
      expect(retrievedGame).toEqual(game)
    })
  })

  describe('getCurrentPlayerFromGame', () => {
    it('should return current player from game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const game = await createAndSaveGame(players)

      // Act
      const currentPlayer = await getCurrentPlayerFromGame(game.id)

      // Assert
      expect(currentPlayer).toBe('alice')
    })

    it('should return null for non-existent game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Act
      const currentPlayer = await getCurrentPlayerFromGame('non-existent-id')

      // Assert
      expect(currentPlayer).toBeNull()
    })

    it('should return correct player after turns', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const game = await createAndSaveGame(players)
      await addTurnToGame(game.id, 'alice', 'a beautiful sunset')

      // Act
      const currentPlayer = await getCurrentPlayerFromGame(game.id)

      // Assert
      expect(currentPlayer).toBe('bob')
    })
  })

  describe('buildPromptFromGame', () => {
    it('should return empty string for new game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const game = await createAndSaveGame(players)

      // Act
      const prompt = await buildPromptFromGame(game.id)

      // Assert
      expect(prompt).toBe('')
    })

    it('should build prompt from turns', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const game = await createAndSaveGame(players)
      await addTurnToGame(game.id, 'alice', 'a beautiful sunset')
      await addTurnToGame(game.id, 'bob', 'over the ocean')

      // Act
      const prompt = await buildPromptFromGame(game.id)

      // Assert
      expect(prompt).toBe('a beautiful sunset over the ocean')
    })

    it('should return empty string for non-existent game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Act
      const prompt = await buildPromptFromGame('non-existent-id')

      // Assert
      expect(prompt).toBe('')
    })
  })

  describe('isGameCompleteInFirebase', () => {
    it('should return false for new game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const game = await createAndSaveGame(players)

      // Act
      const isComplete = await isGameCompleteInFirebase(game.id)

      // Assert
      expect(isComplete).toBe(false)
    })

    it('should return true when game is complete', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const game = await createAndSaveGame(players)
      
      // Add enough turns to complete the game (6 turns for 2 players)
      let updatedGame = game
      for (let i = 0; i < 6; i++) {
        updatedGame = await addTurnToGame(updatedGame.id, updatedGame.players[i % 2], `turn ${i}`)
      }

      // Act
      const isComplete = await isGameCompleteInFirebase(updatedGame.id)

      // Assert
      expect(isComplete).toBe(true)
    })

    it('should return false for non-existent game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Act
      const isComplete = await isGameCompleteInFirebase('non-existent-id')

      // Assert
      expect(isComplete).toBe(false)
    })
  })

  describe('Generation State Management', () => {
    it('should set and clear generating state', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const game = await createAndSaveGame(players)

      // Act - Set generating state
      await setGenerating(game.id)

      // Assert - Check that isGenerating is true
      const gameWithGenerating = await getGameFromFirebase(game.id)
      expect(gameWithGenerating?.isGenerating).toBe(true)

      // Act - Clear generating state
      await clearGenerating(game.id)

      // Assert - Check that isGenerating is false
      const gameWithoutGenerating = await getGameFromFirebase(game.id)
      expect(gameWithoutGenerating?.isGenerating).toBe(false)
    })

    it('should handle generation state for non-existent game', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Act & Assert - Should not throw for non-existent games
      await expect(setGenerating('non-existent-id')).resolves.not.toThrow()
      await expect(clearGenerating('non-existent-id')).resolves.not.toThrow()
    })

    it('should preserve other game fields when setting generation state', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const game = await createAndSaveGame(players)

      // Act
      await setGenerating(game.id)

      // Assert - Other fields should be preserved
      const updatedGame = await getGameFromFirebase(game.id)
      expect(updatedGame?.id).toBe(game.id)
      expect(updatedGame?.players).toEqual(game.players)
      expect(updatedGame?.turns).toEqual(game.turns)
      expect(updatedGame?.status).toBe(game.status)
      expect(updatedGame?.isGenerating).toBe(true)

      // Clean up
      await clearGenerating(game.id)
    })

    it('should handle multiple rapid generation state changes', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping Firebase test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['alice', 'bob']
      const game = await createAndSaveGame(players)

      // Act - Rapid state changes
      await setGenerating(game.id)
      await clearGenerating(game.id)
      await setGenerating(game.id)
      await clearGenerating(game.id)

      // Assert - Final state should be false
      const finalGame = await getGameFromFirebase(game.id)
      expect(finalGame?.isGenerating).toBe(false)
    })
  })

  describe('Unique Display Name Generation', () => {
    it('should return original name when no duplicates exist', () => {
      const existingNames = ['Alice', 'Bob']
      
      const result = computeUniqueDisplayName(existingNames, 'Charlie')
      
      expect(result).toBe('Charlie')
    })

    it('should append (2) when first duplicate is found', () => {
      const existingNames = ['Alice', 'Bob']
      
      const result = computeUniqueDisplayName(existingNames, 'Alice')
      
      expect(result).toBe('Alice (2)')
    })

    it('should append (3) when second duplicate is found', () => {
      const existingNames = ['Alice', 'Alice (2)', 'Bob']
      
      const result = computeUniqueDisplayName(existingNames, 'Alice')
      
      expect(result).toBe('Alice (3)')
    })

    it('should handle multiple duplicates with gaps', () => {
      const existingNames = ['Alice', 'Alice (2)', 'Alice (4)', 'Bob']
      
      const result = computeUniqueDisplayName(existingNames, 'Alice')
      
      expect(result).toBe('Alice (3)')
    })

    it('should handle empty existing names array', () => {
      const existingNames: string[] = []
      
      const result = computeUniqueDisplayName(existingNames, 'Alice')
      
      expect(result).toBe('Alice')
    })

    it('should trim whitespace from base name', () => {
      const existingNames = ['Alice', 'Bob']
      
      const result = computeUniqueDisplayName(existingNames, '  Alice  ')
      
      expect(result).toBe('Alice (2)')
    })

    it('should handle case-sensitive duplicates', () => {
      const existingNames = ['Alice', 'alice', 'ALICE']
      
      const result = computeUniqueDisplayName(existingNames, 'Alice')
      
      expect(result).toBe('Alice (2)')
    })

    it('should handle very long names', () => {
      const longName = 'A'.repeat(50)
      const existingNames = [longName]
      
      const result = computeUniqueDisplayName(existingNames, longName)
      
      expect(result).toBe(`${longName} (2)`)
    })

    it('should handle special characters in names', () => {
      const existingNames = ['Alice!', 'Bob@', 'Charlie#']
      
      const result = computeUniqueDisplayName(existingNames, 'Alice!')
      
      expect(result).toBe('Alice! (2)')
    })
  })
}) 