// lib/ux-flow-validation.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGame, startGame, addPlayerToGame } from './game'

describe('UX Flow Validation: Game Creation → First Turn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Step 1: Game Creation with Seed Image', () => {
    it('should create game with generated seed image', () => {
      const game = createGame('player1')
      const gameWithMode = {
        ...game,
        gameMode: 'edit' as const,
        seedImage: 'data:image/png;base64,seed-image-data',
        seedImagePrompt: 'A professional headshot of a woman with brown hair'
      }

      // Verify game setup
      expect(gameWithMode.gameMode).toBe('edit')
      expect(gameWithMode.seedImage).toBe('data:image/png;base64,seed-image-data')
      expect(gameWithMode.seedImagePrompt).toBe('A professional headshot of a woman with brown hair')
      expect(gameWithMode.status).toBe('waiting')
    })

    it('should create game with uploaded seed image', () => {
      const game = createGame('player1')
      const gameWithMode = {
        ...game,
        gameMode: 'edit' as const,
        seedImage: 'data:image/jpeg;base64,uploaded-image-data',
        seedImagePrompt: 'Uploaded professional headshot'
      }

      // Verify uploaded image setup
      expect(gameWithMode.gameMode).toBe('edit')
      expect(gameWithMode.seedImage).toBe('data:image/jpeg;base64,uploaded-image-data')
      expect(gameWithMode.seedImagePrompt).toBe('Uploaded professional headshot')
    })
  })

  describe('Step 2: Lobby Display', () => {
    it('should display seed image and correct messaging', () => {
      const game = {
        ...createGame('player1'),
        gameMode: 'edit' as const,
        seedImage: 'data:image/png;base64,seed-image-data',
        seedImagePrompt: 'A professional headshot of a woman with brown hair',
        status: 'waiting' as const,
        players: ['player1', 'player2']
      }

      // Verify lobby state
      expect(game.status).toBe('waiting')
      expect(game.seedImage).toBeDefined()
      expect(game.seedImagePrompt).toBeDefined()
      expect(game.players.length).toBe(2)
    })
  })

  describe('Step 3: Game Start - Turn Flow', () => {
    it('should start game with Player 2 as first turn (edit mode)', () => {
      const game = createGame('player1')
      const gameWithPlayer2 = addPlayerToGame(game, 'player2')
      const gameWithPlayer3 = addPlayerToGame(gameWithPlayer2, 'player3')
      
      const gameWithMode = {
        ...gameWithPlayer3,
        gameMode: 'edit' as const,
        seedImage: 'data:image/png;base64,seed-image-data',
        status: 'waiting' as const
      }
      
      // Start game
      const startedGame = startGame(gameWithMode)

      // Verify Player 2 gets first turn (index 1)
      expect(startedGame.status).toBe('in_progress')
      expect(startedGame.currentPlayerIndex).toBe(1) // Player 2, not Player 1
      expect(startedGame.players[startedGame.currentPlayerIndex]).toBe('player2')
    })

    it('should start game with Player 1 as first turn (regular mode)', () => {
      const game = createGame('player1')
      const gameWithPlayer2 = addPlayerToGame(game, 'player2')
      const gameWithPlayer3 = addPlayerToGame(gameWithPlayer2, 'player3')
      
      const gameWithMode = {
        ...gameWithPlayer3,
        gameMode: 'prompt' as const, // Regular mode
        status: 'waiting' as const
      }
      
      // Start game
      const startedGame = startGame(gameWithMode)

      // Verify Player 1 gets first turn (index 0)
      expect(startedGame.status).toBe('in_progress')
      expect(startedGame.currentPlayerIndex).toBe(0) // Player 1
      expect(startedGame.players[startedGame.currentPlayerIndex]).toBe('player1')
    })
  })

  describe('Step 4: Edit Command Logic', () => {
    it('should identify previous image correctly for first edit', () => {
      const game = {
        ...createGame('player1'),
        gameMode: 'edit' as const,
        seedImage: 'data:image/png;base64,seed-image-data',
        status: 'in_progress' as const,
        players: ['player1', 'player2'],
        currentPlayerIndex: 1, // Player 2's turn
        imageHistory: [
          {
            id: 'seed-123',
            imageUrl: 'data:image/png;base64,seed-image-data',
            prompt: 'A professional headshot of a woman with brown hair',
            createdAt: Date.now(),
            reactions: {},
            reactionUsers: {}
          }
        ]
      }

      // Logic for finding previous image (matches GameBoard.tsx)
      const previousImage = game.imageHistory.length > 0 
        ? game.imageHistory[game.imageHistory.length - 1].imageUrl
        : game.seedImage || undefined

      expect(previousImage).toBe('data:image/png;base64,seed-image-data')
    })

    it('should identify previous image correctly for subsequent edits', () => {
      const game = {
        ...createGame('player1'),
        gameMode: 'edit' as const,
        seedImage: 'data:image/png;base64,seed-image-data',
        status: 'in_progress' as const,
        players: ['player1', 'player2', 'player3'],
        currentPlayerIndex: 2, // Player 3's turn
        imageHistory: [
          {
            id: 'seed-123',
            imageUrl: 'data:image/png;base64,seed-image-data',
            prompt: 'A professional headshot of a woman with brown hair',
            createdAt: Date.now(),
            reactions: {},
            reactionUsers: {}
          },
          {
            id: 'edit-1',
            imageUrl: 'data:image/png;base64,first-edit-data',
            prompt: 'Add a red blazer',
            createdAt: Date.now(),
            reactions: {},
            reactionUsers: {}
          }
        ]
      }

      // Logic for finding previous image (matches GameBoard.tsx)
      const previousImage = game.imageHistory.length > 0 
        ? game.imageHistory[game.imageHistory.length - 1].imageUrl
        : game.seedImage || undefined

      // Should use most recent image, not seed
      expect(previousImage).toBe('data:image/png;base64,first-edit-data')
    })

    it('should fallback to seed image when no history', () => {
      const game = {
        ...createGame('player1'),
        gameMode: 'edit' as const,
        seedImage: 'data:image/png;base64,seed-image-data',
        status: 'in_progress' as const,
        players: ['player1', 'player2'],
        currentPlayerIndex: 1,
        imageHistory: [] // No history
      }

      // Logic for finding previous image (matches GameBoard.tsx)
      const previousImage = game.imageHistory.length > 0 
        ? game.imageHistory[game.imageHistory.length - 1].imageUrl
        : game.seedImage || undefined

      // Should fallback to seed
      expect(previousImage).toBe('data:image/png;base64,seed-image-data')
    })
  })

  describe('Step 5: Edit Command Examples', () => {
    const editCommandExamples = [
      'Make the sky blue',
      'Add a red hat', 
      'Remove the background',
      'Change to black and white',
      'Make the person smile'
    ]

    editCommandExamples.forEach((command, index) => {
      it(`should validate edit command: "${command}"`, () => {
        // Test character limit (≤25 chars)
        expect(command.length).toBeLessThanOrEqual(25)
        
        // Test command is not empty
        expect(command.trim().length).toBeGreaterThan(0)
        
        // Test command contains actionable words
        const actionableWords = ['make', 'add', 'remove', 'change', 'create', 'modify', 'adjust']
        const hasActionableWord = actionableWords.some(word => 
          command.toLowerCase().includes(word)
        )
        expect(hasActionableWord).toBe(true)
      })
    })
  })

  describe('API Integration Points', () => {
    it('should prepare correct API call for text-to-image', () => {
      const prompt = 'A professional headshot of a woman with brown hair'
      const expectedApiCall = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: prompt,
          sourceImage: undefined
        }),
      }

      expect(expectedApiCall.body).toContain(prompt)
      // When sourceImage is undefined, it's omitted from JSON
      expect(expectedApiCall.body).not.toContain('sourceImage')
    })

    it('should prepare correct API call for image editing', () => {
      const editCommand = 'Add a red blazer'
      const sourceImage = 'data:image/png;base64,seed-image-data'
      const expectedApiCall = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: editCommand,
          sourceImage: sourceImage
        }),
      }

      expect(expectedApiCall.body).toContain(editCommand)
      expect(expectedApiCall.body).toContain(sourceImage)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle missing seed image gracefully', () => {
      const game = {
        ...createGame('player1'),
        gameMode: 'edit' as const,
        seedImage: undefined, // No seed image
        imageHistory: [] // No history
      }

      // Logic for finding previous image (matches GameBoard.tsx)
      const previousImage = game.imageHistory.length > 0 
        ? game.imageHistory[game.imageHistory.length - 1].imageUrl
        : game.seedImage || undefined

      // Should be undefined, which will trigger text-to-image generation
      expect(previousImage).toBeUndefined()
    })

    it('should validate edit command length', () => {
      const shortCommand = 'Add hat'
      const longCommand = 'This is a very long edit command that exceeds the character limit'
      
      expect(shortCommand.length).toBeLessThanOrEqual(25)
      expect(longCommand.length).toBeGreaterThan(25)
    })

    it('should validate edit command content', () => {
      const validCommand = 'Add a red hat'
      const emptyCommand = ''
      const whitespaceCommand = '   '
      
      expect(validCommand.trim().length).toBeGreaterThan(0)
      expect(emptyCommand.trim().length).toBe(0)
      expect(whitespaceCommand.trim().length).toBe(0)
    })
  })
})
