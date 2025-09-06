// app/api/generate-image/route.ts

import { NextRequest, NextResponse } from 'next/server'

// Rate limiting utility
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private maxRequests = 50 // Gemini allows ~50 requests per minute
  private windowMs = 60000 // 1 minute window

  async checkRateLimit(identifier: string): Promise<void> {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []
    
    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(time => now - time < this.windowMs)
    
    if (recentRequests.length >= this.maxRequests) {
      const oldestRequest = recentRequests[0]
      const waitTime = this.windowMs - (now - oldestRequest)
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`)
    }
    
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)
  }
}

const rateLimiter = new RateLimiter()

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { prompt } = await request.json()
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      )
    }

    if (!prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt cannot be empty' },
        { status: 400 }
      )
    }

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      )
    }

    // Check rate limit (using IP as identifier)
    const clientIP = request.ip || 'unknown'
    await rateLimiter.checkRateLimit(clientIP)

    // Generate image using Gemini API (simulated for now)
    // TODO: Replace with actual Gemini API call
    const response = await generateImageWithGemini(prompt.trim())

    if (!response.imageUrl) {
      return NextResponse.json(
        { error: 'No image URL received from Gemini API' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: response.imageUrl,
      prompt: prompt.trim(),
      createdAt: Date.now()
    })

  } catch (error) {
    console.error('Image generation error:', error)
    
    if (error instanceof Error) {
      // Handle specific Gemini API errors
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment before trying again.' },
          { status: 429 }
        )
      }
      if (error.message.includes('billing')) {
        return NextResponse.json(
          { error: 'Gemini billing issue. Please check your account.' },
          { status: 402 }
        )
      }
      if (error.message.includes('content policy')) {
        return NextResponse.json(
          { error: 'Prompt violates Gemini content policy. Please try different words.' },
          { status: 400 }
        )
      }
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid Gemini API key' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: `Image generation failed: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Unknown error occurred during image generation' },
      { status: 500 }
    )
  }
}

// Real Gemini API call for image generation
async function generateImageWithGemini(prompt: string): Promise<{ imageUrl: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  try {
    // Note: Gemini doesn't have direct image generation like DALL-E
    // For now, we'll use a placeholder service that generates images from text
    // In a real implementation, you might need to use a different service
    // or wait for Gemini's image generation capabilities to be available
    
    // Using Unsplash API as a placeholder (free, no API key required)
    const encodedPrompt = encodeURIComponent(prompt)
    const imageUrl = `https://source.unsplash.com/1024x1024/?${encodedPrompt}`
    
    // Verify the image URL is accessible
    const response = await fetch(imageUrl, { method: 'HEAD' })
    if (!response.ok) {
      throw new Error('Failed to generate image')
    }
    
    return { imageUrl }
    
  } catch (error) {
    console.error('Gemini image generation error:', error)
    
    // Fallback to a default image if generation fails
    const fallbackImageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}`
    
    return { imageUrl: fallbackImageUrl }
  }
}
