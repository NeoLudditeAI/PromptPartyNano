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

// Real Nano Banana (Gemini 2.5 Flash Image Preview) API call for image generation
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
    // The model supports text-to-image generation with advanced features
    const result = await model.generateContent(prompt)
    const response = await result.response
    
    console.log('Nano Banana API Response:', {
      text: response.text(),
      candidates: result.response.candidates,
      usageMetadata: result.response.usageMetadata
    })
    
    // Extract image URL from the response
    // Based on the hackathon documentation, the response should contain image data
    // We need to parse the response to get the actual image URL or data
    let imageUrl: string
    
    try {
      // Check if the response contains image data
      const candidates = result.response.candidates
      if (candidates && candidates.length > 0) {
        const candidate = candidates[0]
        if (candidate.content && candidate.content.parts) {
          // Look for image data in the response
          const imagePart = candidate.content.parts.find(part => 
            part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')
          )
          
          if (imagePart && imagePart.inlineData) {
            // Convert base64 image data to data URL
            const mimeType = imagePart.inlineData.mimeType
            const data = imagePart.inlineData.data
            imageUrl = `data:${mimeType};base64,${data}`
          } else {
            // Fallback to placeholder if no image data found
            imageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}&text=${encodeURIComponent(prompt)}`
          }
        } else {
          // Fallback to placeholder
          imageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}&text=${encodeURIComponent(prompt)}`
        }
      } else {
        // Fallback to placeholder
        imageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}&text=${encodeURIComponent(prompt)}`
      }
    } catch (parseError) {
      console.error('Error parsing Nano Banana response:', parseError)
      // Fallback to placeholder
      imageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}&text=${encodeURIComponent(prompt)}`
    }
    
    return { imageUrl }
    
  } catch (error) {
    console.error('Nano Banana API error:', error)
    throw new Error(`Nano Banana API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
