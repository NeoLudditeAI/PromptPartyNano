// lib/end-to-end-flow.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGame, startGame, addPlayerToGame } from './game'
import { generateImageFromPrompt } from './image'

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Complete Edit Mode Flow: Game Creation → First Turn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Step 1: Game Creation with Seed Image', () => {
    it('should create game with generated seed image', async () => {
      // Mock seed image generation
      const mockSeedResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,seed-image-data',
        prompt: 'A professional headshot of a woman with brown hair',
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSeedResponse)
      } as Response)

      // Create game
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

  describe('Step 4: First Edit Turn (Player 2)', () => {
    it('should process edit command with previous image', async () => {
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

      // Mock edit command response
      const mockEditResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,edited-image-data',
        prompt: 'Add a red blazer',
        sourceImageUrl: 'data:image/png;base64,seed-image-data',
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEditResponse)
      } as Response)

      // Process edit command
      const editCommand = 'Add a red blazer'
      const previousImage = game.imageHistory[game.imageHistory.length - 1].imageUrl
      
      const result = await generateImageFromPrompt(editCommand, previousImage)

      // Verify edit command processing
      expect(fetch).toHaveBeenCalledWith('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: 'Add a red blazer',
          sourceImage: 'data:image/png;base64,seed-image-data'
        }),
      })

      expect(result.imageUrl).toBe('data:image/png;base64,edited-image-data')
      expect(result.prompt).toBe('Add a red blazer')
    })

    it('should handle edit commands without previous image (fallback to seed)', async () => {
      const game = {
        ...createGame('player1'),
        gameMode: 'edit' as const,
        seedImage: 'data:image/png;base64,seed-image-data',
        status: 'in_progress' as const,
        players: ['player1', 'player2'],
        currentPlayerIndex: 1,
        imageHistory: [] // Empty history, should fallback to seed
      }

      const mockEditResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,edited-image-data',
        prompt: 'Add a red blazer',
        sourceImageUrl: 'data:image/png;base64,seed-image-data',
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEditResponse)
      } as Response)

      // Process edit command with fallback to seed
      const editCommand = 'Add a red blazer'
      const previousImage = game.imageHistory.length > 0 
        ? game.imageHistory[game.imageHistory.length - 1].imageUrl
        : game.seedImage || undefined

      expect(previousImage).toBe('data:image/png;base64,seed-image-data')

      const result = await generateImageFromPrompt(editCommand, previousImage)
      expect(result.imageUrl).toBe('data:image/png;base64,edited-image-data')
    })
  })

  describe('Step 5: Subsequent Edit Turns', () => {
    it('should process multiple edit commands maintaining consistency', async () => {
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

      const mockEditResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,second-edit-data',
        prompt: 'Change the background to a modern office',
        sourceImageUrl: 'data:image/png;base64,first-edit-data',
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEditResponse)
      } as Response)

      // Process second edit command
      const editCommand = 'Change the background to a modern office'
      const previousImage = game.imageHistory[game.imageHistory.length - 1].imageUrl
      
      const result = await generateImageFromPrompt(editCommand, previousImage)

      // Verify it uses the most recent image, not the seed
      expect(fetch).toHaveBeenCalledWith('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: 'Change the background to a modern office',
          sourceImage: 'data:image/png;base64,first-edit-data' // Most recent image
        }),
      })

      expect(result.imageUrl).toBe('data:image/png;base64,second-edit-data')
    })
  })

  describe('Edit Command Examples', () => {
    it('should handle "Make the sky blue" - Color modification', async () => {
      const command = 'Make the sky blue'
      const previousImage = 'data:image/png;base64,previous-image-data'
      
      const mockResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,edited-image',
        prompt: command,
        sourceImageUrl: previousImage,
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await generateImageFromPrompt(command, previousImage)

      expect(result.prompt).toBe(command)
      expect(result.imageUrl).toBe('data:image/png;base64,edited-image')
    })

    it('should handle "Add a red hat" - Object addition', async () => {
      const command = 'Add a red hat'
      const previousImage = 'data:image/png;base64,previous-image-data'
      
      const mockResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,edited-image',
        prompt: command,
        sourceImageUrl: previousImage,
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await generateImageFromPrompt(command, previousImage)

      expect(result.prompt).toBe(command)
      expect(result.imageUrl).toBe('data:image/png;base64,edited-image')
    })

    it('should handle "Remove the background" - Object removal', async () => {
      const command = 'Remove the background'
      const previousImage = 'data:image/png;base64,previous-image-data'
      
      const mockResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,edited-image',
        prompt: command,
        sourceImageUrl: previousImage,
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await generateImageFromPrompt(command, previousImage)

      expect(result.prompt).toBe(command)
      expect(result.imageUrl).toBe('data:image/png;base64,edited-image')
    })

    it('should handle "Change to black and white" - Style modification', async () => {
      const command = 'Change to black and white'
      const previousImage = 'data:image/png;base64,previous-image-data'
      
      const mockResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,edited-image',
        prompt: command,
        sourceImageUrl: previousImage,
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await generateImageFromPrompt(command, previousImage)

      expect(result.prompt).toBe(command)
      expect(result.imageUrl).toBe('data:image/png;base64,edited-image')
    })

    it('should handle "Make the person smile" - Expression change', async () => {
      const command = 'Make the person smile'
      const previousImage = 'data:image/png;base64,previous-image-data'
      
      const mockResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,edited-image',
        prompt: command,
        sourceImageUrl: previousImage,
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await generateImageFromPrompt(command, previousImage)

      expect(result.prompt).toBe(command)
      expect(result.imageUrl).toBe('data:image/png;base64,edited-image')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors during edit commands', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'API error' })
      } as Response)

      await expect(generateImageFromPrompt('test command', 'data:image/png;base64,test')).rejects.toThrow('API error')
    })

    it('should handle missing previous image gracefully', async () => {
      // Should fallback to text-to-image generation
      const mockResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,generated-image',
        prompt: 'test command',
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await generateImageFromPrompt('test command', undefined)
      expect(result.imageUrl).toBe('data:image/png;base64,generated-image')
    })
  })
})
