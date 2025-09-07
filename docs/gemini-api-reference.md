# Gemini 2.5 Flash Image Preview (Nano Banana) API Reference

**Last Updated:** January 9, 2025  
**API Version:** Gemini 2.5 Flash Image Preview  
**Model Name:** `gemini-2.5-flash-image-preview`

## Overview

Gemini 2.5 Flash Image Preview, also known as "Nano Banana," is Google's latest image generation model that excels at conversational image creation and editing. It's specifically designed for our hackathon project to showcase advanced image consistency and iterative editing capabilities.

## Key Capabilities

### 🎨 Core Features
- **Text-to-Image:** Generate high-quality images from text descriptions
- **Image + Text-to-Image (Editing):** Modify existing images with text prompts
- **Multi-Image to Image:** Compose scenes or transfer styles between images
- **Iterative Refinement:** Progressive image editing through conversation
- **High-Fidelity Text Rendering:** Generate legible text within images

### 🏆 Unique Strengths for Our Project
- **Unparalleled Image Consistency:** Maintains subject identity across edits
- **Conversational Editing:** Natural language commands for precise modifications
- **Mask-Free Editing:** No complex masking required for targeted changes
- **Multi-Turn Capabilities:** Perfect for our collaborative editing game

## API Endpoints

### Base URL
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent
```

### Authentication
```bash
x-goog-api-key: $GEMINI_API_KEY
Content-Type: application/json
```

## Request Formats

### 1. Text-to-Image Generation

**Use Case:** Creating the initial seed image from Player 1's prompt

```json
{
  "contents": [{
    "parts": [
      {"text": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"}
    ]
  }]
}
```

**JavaScript Implementation:**
```javascript
const response = await fetch('/api/generate-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    prompt: "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"
  }),
});
```

### 2. Image Editing (Text + Image to Image)

**Use Case:** Player 2+ submitting edit commands to modify the previous image

```json
{
  "contents": [{
    "parts": [
      {"text": "Make the sky blue and add a hat to the character"},
      {
        "inlineData": {
          "mimeType": "image/png",
          "data": "base64_encoded_image_data"
        }
      }
    ]
  }]
}
```

**JavaScript Implementation:**
```javascript
const response = await fetch('/api/generate-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    prompt: "Make the sky blue and add a hat to the character",
    sourceImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }),
});
```

## Response Format

### Success Response
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "inlineData": {
          "mimeType": "image/png",
          "data": "base64_encoded_image_data"
        }
      }]
    }
  }]
}
```

### Error Response
```json
{
  "error": {
    "code": 400,
    "message": "Invalid request",
    "status": "INVALID_ARGUMENT"
  }
}
```

## Implementation in Our Project

### Current API Route: `/api/generate-image/route.ts`

```typescript
export async function POST(request: Request) {
  try {
    const { prompt, sourceImage } = await request.json();
    
    const contents = [{
      parts: sourceImage ? [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/png",
            data: sourceImage.replace(/^data:image\/[a-z]+;base64,/, "")
          }
        }
      ] : [
        { text: prompt }
      ]
    }];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the base64 image data
    const imageData = data.candidates[0].content.parts[0].inlineData.data;
    const imageUrl = `data:image/png;base64,${imageData}`;

    return Response.json({
      success: true,
      imageUrl,
      prompt,
      sourceImageUrl: sourceImage || undefined
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

## Best Practices for Our Use Case

### 1. Prompt Engineering for Edit Commands

**Good Edit Commands:**
- "Make the sky blue"
- "Add a red hat to the character"
- "Change the background to a forest"
- "Make the character smile"
- "Add sunglasses to the person"

**Avoid:**
- "Change everything" (too vague)
- "Make it better" (not specific enough)
- "Fix this" (unclear what needs fixing)

### 2. Image Consistency Strategies

**Maintain Subject Identity:**
- Use specific references: "the woman in the blue dress"
- Reference existing elements: "the hat from the previous image"
- Use descriptive language: "the same character but with a different expression"

**Preserve Context:**
- Reference the scene: "in the same restaurant setting"
- Maintain style: "keep the same artistic style"
- Preserve composition: "from the same angle"

### 3. Iterative Refinement Workflow

**Our Game Flow:**
1. **Seed Creation:** Player 1 creates initial image
2. **Edit Commands:** Players submit specific modifications
3. **Progressive Changes:** Each edit builds on the previous
4. **Visual History:** Players can see the evolution

## Error Handling

### Common Error Scenarios

1. **Invalid API Key**
   ```json
   {
     "error": {
       "code": 401,
       "message": "API key not valid",
       "status": "UNAUTHENTICATED"
     }
   }
   ```

2. **Content Policy Violation**
   ```json
   {
     "error": {
       "code": 400,
       "message": "Content policy violation",
       "status": "INVALID_ARGUMENT"
     }
   }
   ```

3. **Rate Limiting**
   ```json
   {
     "error": {
       "code": 429,
       "message": "Quota exceeded",
       "status": "RESOURCE_EXHAUSTED"
     }
   }
   ```

### Error Handling Implementation

```typescript
try {
  const response = await generateImage(prompt, sourceImage);
  return response;
} catch (error) {
  if (error.message.includes('API key not valid')) {
    throw new Error('Invalid API key. Please check your configuration.');
  } else if (error.message.includes('Content policy')) {
    throw new Error('Content policy violation. Please try a different prompt.');
  } else if (error.message.includes('Quota exceeded')) {
    throw new Error('Rate limit exceeded. Please wait before trying again.');
  } else {
    throw new Error('Image generation failed. Please try again.');
  }
}
```

## Rate Limits and Pricing

### Current Limits
- **Rate Limit:** 60 requests per minute
- **Daily Quota:** 1,500 requests per day
- **Image Size:** Up to 1024x1024 pixels

### Pricing
- **Image Generation:** $30 per 1 million tokens
- **Image Output:** 1290 tokens per image (flat rate)
- **Text Processing:** Standard Gemini pricing

### Optimization Strategies
- **Batch Processing:** Group multiple edits when possible
- **Caching:** Store generated images to avoid regeneration
- **Error Retry:** Implement exponential backoff for rate limits

## Security and Compliance

### Content Safety
- All generated images include SynthID watermark
- Content policy enforcement for inappropriate material
- No support for children's images in EEA, CH, and UK

### Data Privacy
- Images are processed by Google's servers
- No permanent storage of user images by Google
- API key should be kept secure and not exposed client-side

## Testing and Validation

### Test Scenarios for Our Project

1. **Seed Image Generation**
   ```javascript
   const seedImage = await generateImage("A majestic mountain landscape at sunset");
   // Verify: Image generated successfully, proper format
   ```

2. **Edit Command Processing**
   ```javascript
   const editedImage = await generateImage("Make the sky purple", seedImage);
   // Verify: Sky changed to purple, other elements preserved
   ```

3. **Multi-Turn Editing**
   ```javascript
   const image1 = await generateImage("A cat sitting on a chair");
   const image2 = await generateImage("Add a hat to the cat", image1);
   const image3 = await generateImage("Make the chair red", image2);
   // Verify: Progressive changes maintain cat identity
   ```

### Validation Checklist
- [ ] API key is valid and has sufficient quota
- [ ] Images are generated in correct format (PNG)
- [ ] Base64 encoding/decoding works correctly
- [ ] Error handling covers all scenarios
- [ ] Rate limiting is properly implemented
- [ ] Content policy violations are handled gracefully

## Integration with Our Game

### Current Implementation Status
- ✅ **Text-to-Image:** Working for seed image generation
- ✅ **Image Editing:** Ready for edit command processing
- ✅ **Error Handling:** Basic implementation complete
- ✅ **Response Parsing:** Base64 image data extraction working
- 🔄 **Multi-Turn Editing:** Needs testing with actual edit commands
- 🔄 **Rate Limiting:** Needs implementation
- 🔄 **Caching:** Not yet implemented

### Next Steps
1. **Test Edit Commands:** Verify image editing works with our game flow
2. **Implement Rate Limiting:** Add proper rate limit handling
3. **Add Caching:** Store generated images to improve performance
4. **Error Recovery:** Implement retry logic for failed requests
5. **Monitoring:** Add logging and metrics for API usage

## Resources

### Official Documentation
- [Gemini API Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Hackathon Kit Repository](https://github.com/google-gemini/nano-banana-hackathon-kit)
- [API Reference](https://ai.google.dev/gemini-api/docs/api-reference)

### Our Project Files
- `/api/generate-image/route.ts` - Main API route
- `/lib/image.ts` - Image generation utilities
- `/types/index.ts` - TypeScript definitions

### Environment Variables
```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash-image-preview
```

---

**Note:** This documentation is specific to our Prompt Party Nano project and focuses on the use cases and implementation patterns we're using for the hackathon submission.
