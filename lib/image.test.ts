// lib/image.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  generateImageFromPrompt,
  enhancePromptForGemini,
  generateEnhancedImage,
  isValidImageUrl,
  updateGameWithImage,
  generateImageForGame
} from './image'
import { ImageGenerationResult } from '../types'

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Image Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateImageFromPrompt', () => {
    it('should generate image from valid prompt', async () => {
      // Arrange
      const prompt = 'a beautiful sunset over the ocean'
      const mockResponse = {
        success: true,
        imageUrl: 'https://example.com/generated-image.png',
        prompt: prompt,
        createdAt: 1234567890
      }
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      // Act
      const result = await generateImageFromPrompt(prompt)

      // Assert
      expect(result).toEqual({
        prompt,
        imageUrl: 'https://example.com/generated-image.png',
        createdAt: 1234567890
      })
      expect(fetch).toHaveBeenCalledWith('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })
    })

    it('should throw error for empty prompt', async () => {
      // Act & Assert
      await expect(generateImageFromPrompt('')).rejects.toThrow('Prompt cannot be empty')
      await expect(generateImageFromPrompt('   ')).rejects.toThrow('Prompt cannot be empty')
    })

    it('should handle API errors gracefully', async () => {
      // Arrange
      const prompt = 'test prompt'
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit exceeded' })
      } as Response)

      // Act & Assert
      await expect(generateImageFromPrompt(prompt)).rejects.toThrow('Image generation failed: Rate limit exceeded')
    })

    it('should handle billing errors', async () => {
      // Arrange
      const prompt = 'test prompt'
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 402,
        json: () => Promise.resolve({ error: 'billing issue' })
      } as Response)

      // Act & Assert
      await expect(generateImageFromPrompt(prompt)).rejects.toThrow('Gemini billing issue. Please check your account.')
    })

    it('should handle content policy violations', async () => {
      // Arrange
      const prompt = 'test prompt'
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'content policy violation' })
      } as Response)

      // Act & Assert
      await expect(generateImageFromPrompt(prompt)).rejects.toThrow('Prompt violates Gemini content policy. Please try different words.')
    })

    it('should handle API key errors', async () => {
      // Arrange
      const prompt = 'test prompt'
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'API key' })
      } as Response)

      // Act & Assert
      await expect(generateImageFromPrompt(prompt)).rejects.toThrow('Gemini API key is not configured properly.')
    })

    it('should handle invalid response', async () => {
      // Arrange
      const prompt = 'test prompt'
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false })
      } as Response)

      // Act & Assert
      await expect(generateImageFromPrompt(prompt)).rejects.toThrow('Invalid response from image generation API')
    })
  })

  describe('enhancePromptForGemini', () => {
    it('should enhance prompt with style improvements', () => {
      // Arrange
      const basePrompt = 'a beautiful sunset'

      // Act
      const enhanced = enhancePromptForGemini(basePrompt)

      // Assert
      expect(enhanced).toBe('a beautiful sunset, high quality, detailed, professional photography')
    })

    it('should return empty string for empty input', () => {
      // Act
      const result = enhancePromptForGemini('')

      // Assert
      expect(result).toBe('')
    })

    it('should handle whitespace-only input', () => {
      // Act
      const result = enhancePromptForGemini('   ')

      // Assert
      expect(result).toBe('   ')
    })

    it('should trim whitespace from enhanced prompt', () => {
      // Arrange
      const basePrompt = '  a beautiful sunset  '

      // Act
      const enhanced = enhancePromptForGemini(basePrompt)

      // Assert
      expect(enhanced).toBe('a beautiful sunset, high quality, detailed, professional photography')
    })
  })

  describe('generateEnhancedImage', () => {
    it('should generate image with enhanced prompt', async () => {
      // Arrange
      const basePrompt = 'a beautiful sunset'
      const mockResponse = {
        success: true,
        imageUrl: 'https://example.com/enhanced-image.png',
        prompt: 'a beautiful sunset, high quality, detailed, professional photography',
        createdAt: 1234567890
      }
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      // Act
      const result = await generateEnhancedImage(basePrompt)

      // Assert
      expect(result.prompt).toBe('a beautiful sunset, high quality, detailed, professional photography')
      expect(result.imageUrl).toBe('https://example.com/enhanced-image.png')
      expect(result.createdAt).toBe(1234567890)
    })
  })

  describe('isValidImageUrl', () => {
    it('should validate correct image URLs', () => {
      // Valid URLs
      expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true)
      expect(isValidImageUrl('https://example.com/image.png')).toBe(true)
      expect(isValidImageUrl('https://example.com/image.jpeg')).toBe(true)
      expect(isValidImageUrl('https://example.com/image.gif')).toBe(true)
      expect(isValidImageUrl('https://example.com/image.webp')).toBe(true)
      expect(isValidImageUrl('http://example.com/image.jpg')).toBe(true)
    })

    it('should reject invalid image URLs', () => {
      // Invalid URLs
      expect(isValidImageUrl('not-a-url')).toBe(false)
      expect(isValidImageUrl('https://example.com/image.txt')).toBe(false)
      expect(isValidImageUrl('https://example.com/image')).toBe(false)
      expect(isValidImageUrl('ftp://example.com/image.jpg')).toBe(false)
      expect(isValidImageUrl('')).toBe(false)
    })
  })

  describe('updateGameWithImage', () => {
    it('should call Firebase append function with correct data', async () => {
      // Arrange
      const gameId = 'test-game-id'
      const imageResult: ImageGenerationResult = {
        prompt: 'test prompt',
        imageUrl: 'https://example.com/image.jpg',
        createdAt: 1234567890
      }
      
      // Mock the Firebase function
      const mockAppendImageToGameHistory = vi.fn().mockResolvedValue(undefined)
      vi.doMock('./firebase', () => ({
        appendImageToGameHistory: mockAppendImageToGameHistory
      }))

      // Act
      await updateGameWithImage(gameId, imageResult, vi.fn())

      // Assert
      expect(mockAppendImageToGameHistory).toHaveBeenCalledWith(gameId, imageResult)
    })
  })

  describe('generateImageForGame', () => {
    it('should generate image and update game', async () => {
      // Arrange
      const gameId = 'test-game-id'
      const prompt = 'a beautiful sunset'
      const mockResponse = {
        success: true,
        imageUrl: 'https://example.com/game-image.png',
        prompt: 'a beautiful sunset, high quality, detailed, professional photography',
        createdAt: 1234567890
      }
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)
      
      // Mock the Firebase function
      const mockAppendImageToGameHistory = vi.fn().mockResolvedValue(undefined)
      vi.doMock('./firebase', () => ({
        appendImageToGameHistory: mockAppendImageToGameHistory
      }))

      // Act
      const result = await generateImageForGame(gameId, prompt, vi.fn())

      // Assert
      expect(result.prompt).toBe('a beautiful sunset, high quality, detailed, professional photography')
      expect(result.imageUrl).toBe('https://example.com/game-image.png')
      expect(mockAppendImageToGameHistory).toHaveBeenCalledWith(gameId, result)
    })
  })
}) 