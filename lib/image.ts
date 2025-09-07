// lib/image.ts

import { ImageGenerationResult } from '../types'

// Google Gemini API configuration
interface GeminiConfig {
  apiKey: string
  model: string
  size: string
  quality: string
}

// Default configuration for Gemini 2.5 Flash Image Preview
const defaultConfig: GeminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-2.5-flash-image-preview',
  size: '1024x1024',
  quality: 'standard'
}

// Main image generation function (client-side)
export async function generateImageFromPrompt(
  prompt: string, 
  sourceImage?: string,
  config: Partial<GeminiConfig> = {}
): Promise<ImageGenerationResult> {
  if (!prompt.trim()) {
    throw new Error('Prompt cannot be empty')
  }

  try {
    // Call our Next.js API route
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: prompt.trim(),
        sourceImage: sourceImage || undefined
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success || !data.imageUrl) {
      throw new Error('Invalid response from image generation API')
    }

    return {
      prompt: data.prompt,
      imageUrl: data.imageUrl,
      createdAt: data.createdAt
    }
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific API errors
      if (error.message.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
      }
      if (error.message.includes('billing')) {
        throw new Error('Gemini billing issue. Please check your account.')
      }
      if (error.message.includes('content policy')) {
        throw new Error('Prompt violates Gemini content policy. Please try different words.')
      }
      if (error.message.includes('API key')) {
        throw new Error('Gemini API key is not configured properly.')
      }
      throw new Error(`Image generation failed: ${error.message}`)
    }
    throw new Error('Unknown error occurred during image generation')
  }
}

// Enhanced prompt builder for better Gemini results
export function enhancePromptForGemini(basePrompt: string): string {
  const trimmedPrompt = basePrompt.trim()
  if (!trimmedPrompt) {
    return basePrompt
  }

  // Add style enhancements for better image generation
  const enhancements = [
    'high quality',
    'detailed',
    'professional photography'
  ]

  const enhancedPrompt = `${trimmedPrompt}, ${enhancements.join(', ')}`
  
  return enhancedPrompt.trim()
}

// Generate image with enhanced prompt
export async function generateEnhancedImage(
  basePrompt: string,
  config: Partial<GeminiConfig> = {}
): Promise<ImageGenerationResult> {
  const enhancedPrompt = enhancePromptForGemini(basePrompt)
  return await generateImageFromPrompt(enhancedPrompt, undefined, config)
}

// Utility function to validate image URLs
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const isValidProtocol = ['http:', 'https:'].includes(parsed.protocol)
    const hasImageExtension = parsed.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null
    return isValidProtocol && hasImageExtension
  } catch {
    return false
  }
}

// Function to update game with new image
export async function updateGameWithImage(
  gameId: string,
  imageResult: ImageGenerationResult,
  updateGameFunction: (gameId: string, updates: any) => Promise<void>
): Promise<void> {
  // Import Firebase function to append to image history
  const { appendImageToGameHistory } = await import('./firebase')
  await appendImageToGameHistory(gameId, imageResult)
}

// Complete workflow: generate image from game prompt and update game
export async function generateImageForGame(
  gameId: string,
  prompt: string,
  updateGameFunction: (gameId: string, updates: any) => Promise<void>,
  sourceImage?: string
): Promise<ImageGenerationResult> {
  // Generate the image using the raw prompt (no enhancements)
  const imageResult = await generateImageFromPrompt(prompt, sourceImage)
  
  // Update the game with the new image
  await updateGameWithImage(gameId, imageResult, updateGameFunction)
  
  return imageResult
}

// Store a seed image in the game's image history
export async function storeSeedImageInGame(
  gameId: string,
  imageUrl: string,
  prompt: string,
  updateGameFunction: (gameId: string, updates: any) => Promise<void>
): Promise<ImageGenerationResult> {
  const seedImageResult: ImageGenerationResult = {
    id: `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    imageUrl: imageUrl,
    prompt: prompt,
    createdAt: Date.now(),
    reactions: {},
    reactionUsers: {},
    editCommand: 'seed',
    sourceImageUrl: undefined // This is the original seed
  }
  
  // Update the game with the seed image
  await updateGameWithImage(gameId, seedImageResult, updateGameFunction)
  
  return seedImageResult
}
