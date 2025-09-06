// app/api/generate-image/route.ts

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Rate limiting utility
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private maxRequests = 50 // OpenAI allows ~50 requests per minute
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
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // Check rate limit (using IP as identifier)
    const clientIP = request.ip || 'unknown'
    await rateLimiter.checkRateLimit(clientIP)

    // Generate image using DALL-E API
    const response = await openai.images.generate({
      model: (process.env.DALLE_MODEL as 'dall-e-3' | 'dall-e-2') || 'dall-e-3',
      prompt: prompt.trim(),
      n: 1,
      size: (process.env.DALLE_SIZE as '1024x1024' | '1792x1024' | '1024x1792') || '1024x1024',
      quality: (process.env.DALLE_QUALITY as 'standard' | 'hd') || 'standard',
      style: (process.env.DALLE_STYLE as 'vivid' | 'natural') || 'vivid',
    })

    if (!response.data || response.data.length === 0) {
      return NextResponse.json(
        { error: 'No image data received from OpenAI API' },
        { status: 500 }
      )
    }

    const imageUrl = response.data[0]?.url
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL received from OpenAI API' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: prompt.trim(),
      createdAt: Date.now()
    })

  } catch (error) {
    console.error('Image generation error:', error)
    
    if (error instanceof Error) {
      // Handle specific OpenAI API errors
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment before trying again.' },
          { status: 429 }
        )
      }
      if (error.message.includes('billing')) {
        return NextResponse.json(
          { error: 'OpenAI billing issue. Please check your account.' },
          { status: 402 }
        )
      }
      if (error.message.includes('content policy')) {
        return NextResponse.json(
          { error: 'Prompt violates OpenAI content policy. Please try different words.' },
          { status: 400 }
        )
      }
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
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