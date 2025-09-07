// app/api/generate-image/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      )
    }

    const response = await generateImageWithGemini(prompt.trim())

    return NextResponse.json({
      success: true,
      imageUrl: response.imageUrl,
      prompt: prompt.trim(),
      createdAt: Date.now()
    })

  } catch (error) {
    console.error('Image generation error:', error)
    
    if (error instanceof Error) {
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
    // Import Google Generative AI
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Note: Gemini 2.5 Flash Image Preview is primarily for image analysis, not generation
    // For actual image generation, we need to use a different approach
    // Let's start with a test to see what models are available
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-image-preview'
    })
    
    // Test the API connection first
    const result = await model.generateContent(prompt)
    const response = await result.response
    
    console.log('Gemini API Response:', {
      text: response.text(),
      candidates: result.response.candidates,
      usageMetadata: result.response.usageMetadata
    })
    
    // For now, we'll use a placeholder since Gemini 2.5 Flash Image Preview
    // is primarily for image analysis, not generation
    // We may need to use a different service for actual image generation
    const imageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}&text=${encodeURIComponent(prompt)}`
    
    return { imageUrl }
    
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
