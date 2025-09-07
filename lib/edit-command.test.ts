// lib/edit-command.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateImageFromPrompt } from './image'

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Edit Command Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Text-to-Image Generation', () => {
    it('should generate image from text prompt only', async () => {
      const mockResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,test-image-data',
        prompt: 'A cat wearing a hat',
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await generateImageFromPrompt('A cat wearing a hat')

      expect(fetch).toHaveBeenCalledWith('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: 'A cat wearing a hat',
          sourceImage: undefined
        }),
      })

      expect(result.imageUrl).toBe('data:image/png;base64,test-image-data')
      expect(result.prompt).toBe('A cat wearing a hat')
    })
  })

  describe('Image Editing (Image + Text to Image)', () => {
    it('should edit existing image with text command', async () => {
      const sourceImage = 'data:image/png;base64,source-image-data'
      const editCommand = 'Make the hat red'
      
      const mockResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,edited-image-data',
        prompt: 'Make the hat red',
        sourceImageUrl: sourceImage,
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await generateImageFromPrompt(editCommand, sourceImage)

      expect(fetch).toHaveBeenCalledWith('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: 'Make the hat red',
          sourceImage: sourceImage
        }),
      })

      expect(result.imageUrl).toBe('data:image/png;base64,edited-image-data')
      expect(result.prompt).toBe('Make the hat red')
    })

    it('should handle different image formats', async () => {
      const sourceImage = 'data:image/jpeg;base64,source-image-data'
      const editCommand = 'Add sunglasses'
      
      const mockResponse = {
        success: true,
        imageUrl: 'data:image/png;base64,edited-image-data',
        prompt: 'Add sunglasses',
        sourceImageUrl: sourceImage,
        createdAt: Date.now()
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await generateImageFromPrompt(editCommand, sourceImage)

      expect(fetch).toHaveBeenCalledWith('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: 'Add sunglasses',
          sourceImage: sourceImage
        }),
      })

      expect(result.imageUrl).toBe('data:image/png;base64,edited-image-data')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'API error' })
      } as Response)

      await expect(generateImageFromPrompt('test prompt')).rejects.toThrow('API error')
    })

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(generateImageFromPrompt('test prompt')).rejects.toThrow('Network error')
    })

    it('should validate empty prompts', async () => {
      await expect(generateImageFromPrompt('')).rejects.toThrow('Prompt cannot be empty')
      await expect(generateImageFromPrompt('   ')).rejects.toThrow('Prompt cannot be empty')
    })
  })

  describe('Edit Command Examples', () => {
    const testCases = [
      {
        command: 'Make the sky blue',
        description: 'Color modification'
      },
      {
        command: 'Add a red hat',
        description: 'Object addition'
      },
      {
        command: 'Remove the background',
        description: 'Object removal'
      },
      {
        command: 'Change to black and white',
        description: 'Style modification'
      },
      {
        command: 'Make the person smile',
        description: 'Expression change'
      }
    ]

    testCases.forEach(({ command, description }) => {
      it(`should handle "${command}" - ${description}`, async () => {
        const sourceImage = 'data:image/png;base64,test-image'
        
        const mockResponse = {
          success: true,
          imageUrl: 'data:image/png;base64,edited-image',
          prompt: command,
          sourceImageUrl: sourceImage,
          createdAt: Date.now()
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        } as Response)

        const result = await generateImageFromPrompt(command, sourceImage)

        expect(result.prompt).toBe(command)
        expect(result.imageUrl).toBe('data:image/png;base64,edited-image')
      })
    })
  })
})
