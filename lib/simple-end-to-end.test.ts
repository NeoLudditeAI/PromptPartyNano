// lib/simple-end-to-end.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGame, startGame, addPlayerToGame } from './game'
import { generateImageFromPrompt } from './image'

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Simple End-to-End Edit Mode Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockReset()
  })

  it('should create game with edit mode and process edit commands', async () => {
    // Create game
    const game = createGame('player1')
    const gameWithMode = {
      ...game,
      gameMode: 'edit' as const,
      seedImage: 'data:image/png;base64,seed-image-data',
      seedImagePrompt: 'A professional headshot'
    }

    // Verify game setup
    expect(gameWithMode.gameMode).toBe('edit')
    expect(gameWithMode.seedImage).toBe('data:image/png;base64,seed-image-data')

    // Add second player
    const gameWithPlayer2 = addPlayerToGame(gameWithMode, 'player2')
    expect(gameWithPlayer2.players).toHaveLength(2)

    // Start game (should set currentPlayerIndex to 1 for Player 2)
    const startedGame = startGame(gameWithPlayer2)
    expect(startedGame.currentPlayerIndex).toBe(1) // Player 2's turn
    expect(startedGame.status).toBe('in_progress')

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
    const result = await generateImageFromPrompt('Add a red blazer', 'data:image/png;base64,seed-image-data')

    // Verify API call
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

    // Verify response
    expect(result.imageUrl).toBe('data:image/png;base64,edited-image-data')
    expect(result.prompt).toBe('Add a red blazer')
  })

  it('should handle text-to-image generation (no source image)', async () => {
    const mockResponse = {
      success: true,
      imageUrl: 'data:image/png;base64,generated-image',
      prompt: 'A beautiful landscape',
      createdAt: Date.now()
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    const result = await generateImageFromPrompt('A beautiful landscape')

    expect(fetch).toHaveBeenCalledWith('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: 'A beautiful landscape',
        sourceImage: undefined
      }),
    })

    expect(result.imageUrl).toBe('data:image/png;base64,generated-image')
    expect(result.prompt).toBe('A beautiful landscape')
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'API error' })
    } as Response)

    await expect(generateImageFromPrompt('test command', 'data:image/png;base64,test')).rejects.toThrow('API error')
  })
})
