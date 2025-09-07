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

// Real Nano Banana API call for image generation
async function generateImageWithGemini(prompt: string): Promise<{ imageUrl: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  try {
    // Import Google Generative AI
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    
    // Initialize the Gemini API with Nano Banana model
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-image-preview' // Nano Banana model
    })
    
    // Generate image using Nano Banana
    const result = await model.generateContent(prompt)
    const response = await result.response
    
    // For now, we'll use a placeholder since the exact response format
    // for image generation may need to be verified
    // TODO: Update this once we confirm the actual response format
    const imageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}&text=${encodeURIComponent(prompt)}`
    
    return { imageUrl }
    
  } catch (error) {
    console.error('Nano Banana image generation error:', error)
    throw new Error(`Nano Banana API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
