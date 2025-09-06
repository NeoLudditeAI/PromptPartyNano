// lib/firebase-integration.test.ts
// Integration tests for Firebase with real configuration

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
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
  getAllPlayerInfo
} from './firebase'
import { PlayerId } from '../types'

// Helper function to check if Firebase is configured
const isFirebaseConfigured = () => {
  return process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL &&
         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
         !process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL.includes('mock-project-id')
}

describe('Firebase Integration Tests (Real Firebase)', () => {
  beforeAll(() => {
    if (!isFirebaseConfigured()) {
      console.log('⚠️  Skipping Firebase integration tests - Firebase not configured')
      console.log('   Set up Firebase environment variables to run these tests')
    }
  })

  describe('Real Firebase Operations', () => {
    it('should create and retrieve a game from Firebase', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['test-alice', 'test-bob']
      const game = await createAndSaveGame(players)

      try {
        // Act
        const retrievedGame = await getGameFromFirebase(game.id)

        // Assert
        expect(retrievedGame).toEqual(game)
        expect(retrievedGame?.players).toEqual(players)
        expect(retrievedGame?.turns).toEqual([])
        expect(retrievedGame?.currentPlayerIndex).toBe(0)

        console.log('✅ Game creation and retrieval test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should add turns and update game state', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['test-alice', 'test-bob']
      const game = await createAndSaveGame(players)

      try {
        // Act - Add a turn
        const updatedGame = await addTurnToGame(game.id, 'test-alice', 'a beautiful sunset')

        // Assert
        expect(updatedGame.turns).toHaveLength(1)
        expect(updatedGame.turns[0]).toEqual({
          userId: 'test-alice',
          text: 'a beautiful sunset',
          timestamp: expect.any(Number)
        })
        expect(updatedGame.currentPlayerIndex).toBe(1) // Should be bob's turn now

        // Verify it was saved to Firebase
        const retrievedGame = await getGameFromFirebase(game.id)
        expect(retrievedGame?.turns).toHaveLength(1)
        expect(retrievedGame?.currentPlayerIndex).toBe(1)

        console.log('✅ Turn addition test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should build prompts from Firebase game data', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['test-alice', 'test-bob']
      const game = await createAndSaveGame(players)
      await addTurnToGame(game.id, 'test-alice', 'a beautiful sunset')
      await addTurnToGame(game.id, 'test-bob', 'over the ocean')

      try {
        // Act
        const prompt = await buildPromptFromGame(game.id)

        // Assert
        expect(prompt).toBe('a beautiful sunset over the ocean')

        console.log('✅ Prompt building test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should track current player correctly', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['test-alice', 'test-bob']
      const game = await createAndSaveGame(players)

      try {
        // Act - Check initial player
        let currentPlayer = await getCurrentPlayerFromGame(game.id)
        expect(currentPlayer).toBe('test-alice')

        // Act - Add a turn and check next player
        await addTurnToGame(game.id, 'test-alice', 'a beautiful sunset')
        currentPlayer = await getCurrentPlayerFromGame(game.id)
        expect(currentPlayer).toBe('test-bob')

        // Act - Add another turn and check loop back
        await addTurnToGame(game.id, 'test-bob', 'over the ocean')
        currentPlayer = await getCurrentPlayerFromGame(game.id)
        expect(currentPlayer).toBe('test-alice')

        console.log('✅ Current player tracking test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should detect game completion correctly', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['test-alice', 'test-bob']
      const game = await createAndSaveGame(players)

      try {
        // Act - Check initial state
        let isComplete = await isGameCompleteInFirebase(game.id)
        expect(isComplete).toBe(false)

        // Act - Add enough turns to complete the game (6 turns for 2 players)
        for (let i = 0; i < 6; i++) {
          const currentPlayer = await getCurrentPlayerFromGame(game.id)
          await addTurnToGame(game.id, currentPlayer!, `turn ${i}`)
        }

        // Act - Check completion
        isComplete = await isGameCompleteInFirebase(game.id)
        expect(isComplete).toBe(true)

        console.log('✅ Game completion detection test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })
  })

  describe('Player Name Preservation and Real-time Sync Tests', () => {
    it('should store and retrieve player display names correctly', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange - Create game with players that have display names
      const { User } = await import('../types')
      const players: User[] = [
        { id: 'test-alice', displayName: 'Alice' },
        { id: 'test-bob', displayName: 'Bob' }
      ]
      const game = await createAndSaveGame(players)

      try {
        // Act - Get all player info
        const allPlayerInfo = await getAllPlayerInfo(game.id)

        // Assert
        expect(allPlayerInfo).toHaveLength(2)
        expect(allPlayerInfo).toEqual([
          { id: 'test-alice', displayName: 'Alice' },
          { id: 'test-bob', displayName: 'Bob' }
        ])

        console.log('✅ Player name storage and retrieval test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should add new player and preserve all player names', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange - Create game with initial players
      const { User } = await import('../types')
      const initialPlayers: User[] = [
        { id: 'test-alice', displayName: 'Alice' },
        { id: 'test-bob', displayName: 'Bob' }
      ]
      const game = await createAndSaveGame(initialPlayers)

      try {
        // Act - Add a new player
        const newPlayerId = 'test-charlie'
        const newPlayerName = 'Charlie'
        const updatedGame = await addPlayerToGame(game.id, newPlayerId, newPlayerName)

        // Assert - Game should have 3 players
        expect(updatedGame.players).toHaveLength(3)
        expect(updatedGame.players).toContain(newPlayerId)

        // Act - Get all player info including the new player
        const allPlayerInfo = await getAllPlayerInfo(game.id)

        // Assert - Should have all 3 players with correct names
        expect(allPlayerInfo).toHaveLength(3)
        expect(allPlayerInfo).toEqual([
          { id: 'test-alice', displayName: 'Alice' },
          { id: 'test-bob', displayName: 'Bob' },
          { id: 'test-charlie', displayName: 'Charlie' }
        ])

        console.log('✅ Player addition with name preservation test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should validate turns correctly after adding new players', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange - Create game with 2 players
      const { User } = await import('../types')
      const initialPlayers: User[] = [
        { id: 'test-alice', displayName: 'Alice' },
        { id: 'test-bob', displayName: 'Bob' }
      ]
      const game = await createAndSaveGame(initialPlayers)

      try {
        // Act - Add a third player
        const newPlayerId = 'test-charlie'
        const newPlayerName = 'Charlie'
        await addPlayerToGame(game.id, newPlayerId, newPlayerName)

        // Act - Check current player (should still be Alice since no turns taken)
        let currentPlayer = await getCurrentPlayerFromGame(game.id)
        expect(currentPlayer).toBe('test-alice')

        // Act - Alice takes her turn
        await addTurnToGame(game.id, 'test-alice', 'a beautiful sunset')

        // Act - Check current player (should now be Bob)
        currentPlayer = await getCurrentPlayerFromGame(game.id)
        expect(currentPlayer).toBe('test-bob')

        // Act - Bob takes his turn
        await addTurnToGame(game.id, 'test-bob', 'over the ocean')

        // Act - Check current player (should now be Charlie)
        currentPlayer = await getCurrentPlayerFromGame(game.id)
        expect(currentPlayer).toBe('test-charlie')

        // Act - Charlie takes his turn
        await addTurnToGame(game.id, 'test-charlie', 'with dolphins')

        // Act - Check current player (should loop back to Alice)
        currentPlayer = await getCurrentPlayerFromGame(game.id)
        expect(currentPlayer).toBe('test-alice')

        console.log('✅ Turn validation after adding players test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should remove player from game correctly', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange - Create game with 3 players
      const { User } = await import('../types')
      const initialPlayers: User[] = [
        { id: 'test-alice', displayName: 'Alice' },
        { id: 'test-bob', displayName: 'Bob' },
        { id: 'test-charlie', displayName: 'Charlie' }
      ]
      const game = await createAndSaveGame(initialPlayers)

      try {
        // Act - Remove a player
        const { removePlayerFromGame } = await import('./firebase')
        const sessionId = 'test-session-123'
        
        // Create session for the player we're going to remove
        const { createPlayerSession } = await import('./firebase')
        await createPlayerSession(game.id, 'test-bob', sessionId)
        
        // Remove the player
        await removePlayerFromGame(game.id, 'test-bob', sessionId)

        // Assert - Verify player was removed by getting fresh game data
        const { getGameFromFirebase } = await import('./firebase')
        const updatedGame = await getGameFromFirebase(game.id)
        expect(updatedGame).toBeDefined()
        expect(updatedGame?.players).toHaveLength(2)
        expect(updatedGame?.players).not.toContain('test-bob')
        expect(updatedGame?.players).toContain('test-alice')
        expect(updatedGame?.players).toContain('test-charlie')

        // Verify player info was removed from Firebase
        const { getPlayerInfo } = await import('./firebase')
        const playerInfo = await getPlayerInfo(game.id, 'test-bob')
        expect(playerInfo).toBeNull()

        // Verify session was removed from Firebase
        const { validatePlayerSession } = await import('./firebase')
        const sessionValid = await validatePlayerSession(game.id, 'test-bob', sessionId)
        expect(sessionValid).toBe(false)

        console.log('✅ Player removal test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should handle creator leaving and reassign creator', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange - Create game with 2 players
      const { User } = await import('../types')
      const initialPlayers: User[] = [
        { id: 'test-alice', displayName: 'Alice' },
        { id: 'test-bob', displayName: 'Bob' }
      ]
      const game = await createAndSaveGame(initialPlayers)

      try {
        // Act - Creator (Alice) leaves the game
        const { removePlayerFromGame } = await import('./firebase')
        const sessionId = 'test-session-123'
        
        // Create session for the creator
        const { createPlayerSession } = await import('./firebase')
        await createPlayerSession(game.id, 'test-alice', sessionId)
        
        // Remove the creator
        await removePlayerFromGame(game.id, 'test-alice', sessionId)

        // Assert - Verify creator was reassigned by getting fresh game data
        const { getGameFromFirebase } = await import('./firebase')
        const updatedGame = await getGameFromFirebase(game.id)
        expect(updatedGame).toBeDefined()
        expect(updatedGame?.players).toHaveLength(1)
        expect(updatedGame?.players).toContain('test-bob')
        expect(updatedGame?.creator).toBe('test-bob')

        console.log('✅ Creator reassignment test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should prevent wrong player from taking turns', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange - Create game with 2 players
      const { User } = await import('../types')
      const initialPlayers: User[] = [
        { id: 'test-alice', displayName: 'Alice' },
        { id: 'test-bob', displayName: 'Bob' }
      ]
      const game = await createAndSaveGame(initialPlayers)

      try {
        // Act & Assert - Bob tries to take turn when it's Alice's turn
        await expect(
          addTurnToGame(game.id, 'test-bob', 'a beautiful sunset')
        ).rejects.toThrow("It's not test-bob's turn. Current player is test-alice")

        // Act - Alice takes her turn
        await addTurnToGame(game.id, 'test-alice', 'a beautiful sunset')

        // Act & Assert - Alice tries to take another turn when it's Bob's turn
        await expect(
          addTurnToGame(game.id, 'test-alice', 'over the ocean')
        ).rejects.toThrow("It's not test-alice's turn. Current player is test-bob")

        console.log('✅ Turn validation security test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should handle real-time game state updates correctly', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange - Create game with 2 players
      const { User } = await import('../types')
      const initialPlayers: User[] = [
        { id: 'test-alice', displayName: 'Alice' },
        { id: 'test-bob', displayName: 'Bob' }
      ]
      const game = await createAndSaveGame(initialPlayers)

      try {
        // Act - Simulate real-time updates by getting fresh game state
        let freshGame = await getGameFromFirebase(game.id)
        expect(freshGame?.players).toHaveLength(2)

        // Act - Add a new player
        await addPlayerToGame(game.id, 'test-charlie', 'Charlie')

        // Act - Get fresh game state again
        freshGame = await getGameFromFirebase(game.id)
        expect(freshGame?.players).toHaveLength(3)
        expect(freshGame?.players).toContain('test-charlie')

        // Act - Get all player info to verify names are preserved
        const allPlayerInfo = await getAllPlayerInfo(game.id)
        expect(allPlayerInfo).toHaveLength(3)
        expect(allPlayerInfo).toEqual([
          { id: 'test-alice', displayName: 'Alice' },
          { id: 'test-bob', displayName: 'Bob' },
          { id: 'test-charlie', displayName: 'Charlie' }
        ])

        console.log('✅ Real-time game state updates test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })
  })

  describe('Generation State Integration', () => {
    it('should coordinate generation state across multiple operations', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['test-alice', 'test-bob']
      const game = await createAndSaveGame(players)

      try {
        // Act - Set generating state
        const { setGenerating, clearGenerating } = await import('./firebase')
        await setGenerating(game.id)

        // Assert - Check state is set
        const gameWithGenerating = await getGameFromFirebase(game.id)
        expect(gameWithGenerating?.isGenerating).toBe(true)

        // Act - Add a turn (simulating turn submission)
        const updatedGame = await addTurnToGame(game.id, 'test-alice', 'a beautiful sunset')

        // Assert - Game should still be generating
        const gameAfterTurn = await getGameFromFirebase(game.id)
        expect(gameAfterTurn?.isGenerating).toBe(true)

        // Act - Clear generating state
        await clearGenerating(game.id)

        // Assert - State should be cleared
        const finalGame = await getGameFromFirebase(game.id)
        expect(finalGame?.isGenerating).toBe(false)

        console.log('✅ Generation state coordination test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should handle generation state with image history updates', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['test-alice', 'test-bob']
      const game = await createAndSaveGame(players)

      try {
        // Act - Set generating state
        const { setGenerating, clearGenerating, appendImageToGameHistory } = await import('./firebase')
        await setGenerating(game.id)

        // Simulate image generation result
        const imageResult = {
          prompt: 'a beautiful sunset',
          imageUrl: 'https://example.com/image.jpg',
          createdAt: Date.now()
        }

        // Act - Add image to history (simulating image generation completion)
        await appendImageToGameHistory(game.id, imageResult)

        // Assert - Game should still be generating until explicitly cleared
        const gameWithImage = await getGameFromFirebase(game.id)
        expect(gameWithImage?.isGenerating).toBe(true)
        expect(gameWithImage?.imageHistory).toHaveLength(1)

        // Act - Clear generating state
        await clearGenerating(game.id)

        // Assert - Final state
        const finalGame = await getGameFromFirebase(game.id)
        expect(finalGame?.isGenerating).toBe(false)
        expect(finalGame?.imageHistory).toHaveLength(1)

        console.log('✅ Generation state with image history test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })
  })

  describe('Duplicate Name Prevention', () => {
    it('should prevent duplicate names when joining games', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['test-alice', 'test-bob']
      const game = await createAndSaveGame(players)

      try {
        // Act - Add first player with name "Alice"
        const { addPlayerToGame } = await import('./firebase')
        await addPlayerToGame(game.id, 'test-alice', 'Alice')

        // Act - Add second player with same name "Alice"
        await addPlayerToGame(game.id, 'test-charlie', 'Alice')

        // Act - Add third player with same name "Alice"
        await addPlayerToGame(game.id, 'test-david', 'Alice')

        // Assert - Get all player info to verify unique names
        const { getAllPlayerInfo } = await import('./firebase')
        const allPlayerInfo = await getAllPlayerInfo(game.id)
        const displayNames = allPlayerInfo.map(p => p.displayName)

        expect(displayNames).toContain('Alice')
        expect(displayNames).toContain('Alice (2)')
        expect(displayNames).toContain('Alice (3)')
        expect(displayNames).toHaveLength(3)

        console.log('✅ Duplicate name prevention test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should handle gaps in duplicate name numbering', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['test-alice', 'test-bob']
      const game = await createAndSaveGame(players)

      try {
        // Act - Add players with names that create gaps
        const { addPlayerToGame } = await import('./firebase')
        await addPlayerToGame(game.id, 'test-alice', 'Alice')
        await addPlayerToGame(game.id, 'test-charlie', 'Alice')
        await addPlayerToGame(game.id, 'test-david', 'Alice')
        
        // Remove the second player to create a gap
        const { removePlayerFromGame } = await import('./firebase')
        await removePlayerFromGame(game.id, 'test-charlie', 'session-123')

        // Act - Add new player with name "Alice" (should fill the gap)
        await addPlayerToGame(game.id, 'test-eve', 'Alice')

        // Assert - Get all player info to verify gap filling
        const { getAllPlayerInfo } = await import('./firebase')
        const allPlayerInfo = await getAllPlayerInfo(game.id)
        const displayNames = allPlayerInfo.map(p => p.displayName)

        expect(displayNames).toContain('Alice')
        expect(displayNames).toContain('Alice (2)') // Should fill the gap
        expect(displayNames).toContain('Alice (3)')
        expect(displayNames).toHaveLength(3)

        console.log('✅ Gap filling in duplicate names test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })

    it('should preserve unique names when players leave and rejoin', async () => {
      if (!isFirebaseConfigured()) {
        console.log('Skipping test - Firebase not configured')
        return
      }

      // Arrange
      const players: PlayerId[] = ['test-alice', 'test-bob']
      const game = await createAndSaveGame(players)

      try {
        // Act - Add players with duplicate names
        const { addPlayerToGame, removePlayerFromGame } = await import('./firebase')
        await addPlayerToGame(game.id, 'test-alice', 'Alice')
        await addPlayerToGame(game.id, 'test-charlie', 'Alice')
        await addPlayerToGame(game.id, 'test-david', 'Alice')

        // Act - Remove a player
        await removePlayerFromGame(game.id, 'test-charlie', 'session-123')

        // Act - Add new player with same name
        await addPlayerToGame(game.id, 'test-eve', 'Alice')

        // Assert - Verify names are still unique
        const { getAllPlayerInfo } = await import('./firebase')
        const allPlayerInfo = await getAllPlayerInfo(game.id)
        const displayNames = allPlayerInfo.map(p => p.displayName)

        expect(displayNames).toContain('Alice')
        expect(displayNames).toContain('Alice (2)')
        expect(displayNames).toContain('Alice (3)')
        expect(displayNames).toHaveLength(3)

        console.log('✅ Name preservation after leave/rejoin test passed')
      } finally {
        // Cleanup
        try {
          const { database } = await import('./firebase-config')
          const { ref, remove } = await import('firebase/database')
          const gameRef = ref(database, `games/${game.id}`)
          await remove(gameRef)
        } catch (error) {
          console.log('Cleanup failed (non-critical):', error)
        }
      }
    })
  })
}) 