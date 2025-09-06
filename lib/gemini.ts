// lib/gemini.ts
// Gemini 2.5 Flash Image Preview (Nano Banana) API integration

import { GeminiConfig, GeminiImageRequest, GeminiImageResponse, FeatureBadge, FeatureBadgeType } from '../types';

// Gemini API configuration
const getGeminiConfig = (): GeminiConfig => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  return {
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-image-preview',
    size: process.env.GEMINI_SIZE || '1024x1024',
    quality: process.env.GEMINI_QUALITY || 'standard',
    apiKey
  };
};

// Base instruction for all image edits
const BASE_INSTRUCTION = "Edit the provided image. Preserve the main subject if present. Apply the change succinctly; keep lighting/shadows consistent. Avoid unintended alterations.";

// Expand user edit command into structured instruction
export const expandEditCommand = (editCommand: string, referenceImageUrl?: string): string => {
  let expandedPrompt = BASE_INSTRUCTION;
  
  // Add reference image context if provided
  if (referenceImageUrl) {
    expandedPrompt += " Use the reference image for style, color palette, or composition guidance.";
  }
  
  // Expand the user's edit command
  const delta = expandUserEdit(editCommand);
  expandedPrompt += ` ${delta}`;
  
  return expandedPrompt;
};

// Expand user edit command into clearer directive
const expandUserEdit = (editCommand: string): string => {
  // Simple expansion rules - can be enhanced with AI
  const expansions: { [key: string]: string } = {
    'rm': 'remove',
    'add': 'add',
    'swap': 'replace with',
    'change': 'modify',
    'make': 'transform to',
    'color': 'change color to',
    'style': 'apply style',
    'size': 'resize to',
    'move': 'relocate',
    'rotate': 'rotate',
    'flip': 'flip',
    'crop': 'crop to',
    'blur': 'apply blur effect',
    'sharpen': 'apply sharpening',
    'brighten': 'increase brightness',
    'darken': 'decrease brightness',
    'saturate': 'increase saturation',
    'desaturate': 'decrease saturation'
  };

  let expanded = editCommand.toLowerCase();
  
  // Apply expansions
  Object.entries(expansions).forEach(([short, long]) => {
    const regex = new RegExp(`\\b${short}\\b`, 'gi');
    expanded = expanded.replace(regex, long);
  });
  
  return expanded;
};

// Detect feature badges based on edit and response
export const detectFeatureBadges = async (
  editCommand: string,
  referenceImageUrl?: string,
  imageUrl?: string
): Promise<FeatureBadge[]> => {
  const badges: FeatureBadge[] = [];

  // Edit Badge - Always present for any text-and-image call
  badges.push({
    type: 'edit',
    description: 'Text-to-Image Editing',
    verified: true,
    icon: '🎨'
  });

  // Fusion Badge - When reference image is present
  if (referenceImageUrl) {
    badges.push({
      type: 'fusion',
      description: 'Multi-Image Fusion',
      verified: true,
      icon: '🔀'
    });
  }

  // Text Badge - When text is detected in the image
  if (imageUrl) {
    const textDetected = await detectTextInImage(imageUrl);
    if (textDetected.length > 0) {
      badges.push({
        type: 'text',
        description: 'High-Fidelity Text Rendering',
        verified: true,
        icon: '📝'
      });
    }
  }

  // Consistency Badge - When subject similarity is maintained
  // This would require comparing with previous images
  if (editCommand.includes('keep') || editCommand.includes('maintain')) {
    badges.push({
      type: 'consistency',
      description: 'Subject Consistency Maintained',
      verified: true,
      icon: '🔄'
    });
  }

  // Verified Badge - When SynthID watermark is detected
  if (imageUrl) {
    const synthIdDetected = await detectSynthIdWatermark(imageUrl);
    if (synthIdDetected) {
      badges.push({
        type: 'verified',
        description: 'SynthID Watermark Detected',
        verified: true,
        icon: '✅'
      });
    }
  }

  return badges;
};

// Detect text in image using OCR (simplified implementation)
const detectTextInImage = async (imageUrl: string): Promise<string[]> => {
  // This is a simplified implementation
  // In a real app, you'd use a proper OCR service like Google Cloud Vision API
  // For now, we'll simulate text detection based on common patterns
  
  const textPatterns = [
    'text', 'word', 'letter', 'font', 'type', 'caption', 'title', 'label',
    'sign', 'logo', 'brand', 'name', 'tag', 'quote', 'slogan'
  ];
  
  // Simulate text detection - in reality, you'd analyze the actual image
  const hasText = Math.random() > 0.7; // 30% chance of detecting text
  
  if (hasText) {
    return ['Sample text detected'];
  }
  
  return [];
};

// Detect SynthID watermark (simplified implementation)
const detectSynthIdWatermark = async (imageUrl: string): Promise<boolean> => {
  // This is a simplified implementation
  // In a real app, you'd use Google's SynthID detection API
  // For now, we'll simulate watermark detection
  
  const hasWatermark = Math.random() > 0.5; // 50% chance of detecting watermark
  
  return hasWatermark;
};

// Generate image using Gemini API
export const generateImage = async (request: GeminiImageRequest): Promise<GeminiImageResponse> => {
  const config = getGeminiConfig();
  
  try {
    // For now, we'll simulate the API call
    // In a real implementation, you'd make an actual HTTP request to the Gemini API
    
    const response = await simulateGeminiApiCall(request, config);
    
    // Detect feature badges
    const featureBadges = await detectFeatureBadges(
      request.editCommand || '',
      request.referenceImageUrl,
      response.imageUrl
    );
    
    return {
      imageUrl: response.imageUrl,
      featureBadges,
      synthIdDetected: response.synthIdDetected,
      textDetected: response.textDetected
    };
    
  } catch (error) {
    console.error('Error generating image with Gemini:', error);
    throw new Error('Failed to generate image with Gemini API');
  }
};

// Simulate Gemini API call (replace with real implementation)
const simulateGeminiApiCall = async (
  request: GeminiImageRequest,
  config: GeminiConfig
): Promise<{ imageUrl: string; synthIdDetected: boolean; textDetected: string[] }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate a mock image URL
  const imageId = Math.random().toString(36).substring(7);
  const imageUrl = `https://picsum.photos/1024/1024?random=${imageId}`;
  
  // Simulate feature detection
  const synthIdDetected = Math.random() > 0.5;
  const textDetected = Math.random() > 0.7 ? ['Sample text'] : [];
  
  return {
    imageUrl,
    synthIdDetected,
    textDetected
  };
};

// Real Gemini API implementation (to be implemented)
const callGeminiApi = async (
  request: GeminiImageRequest,
  config: GeminiConfig
): Promise<{ imageUrl: string; synthIdDetected: boolean; textDetected: string[] }> => {
  // TODO: Implement actual Gemini API call
  // This would involve:
  // 1. Making HTTP request to Gemini API endpoint
  // 2. Sending the image and prompt
  // 3. Processing the response
  // 4. Extracting the generated image URL
  
  throw new Error('Real Gemini API implementation not yet available');
};
